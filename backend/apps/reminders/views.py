import hmac

from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PushSubscription, Reminder
from .serializers import PushSubscriptionSerializer, ReminderSerializer
from .services import fire_all_due, fire_reminder, fire_user_due, send_test_push
from .vapid import public_key as vapid_public_key


class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer

    def get_queryset(self):
        qs = Reminder.objects.filter(user=self.request.user)
        practice_slug = self.request.query_params.get("practice_slug")
        if practice_slug:
            qs = qs.filter(practice_slug=practice_slug)
        return qs

    def perform_create(self, serializer):
        # Save with a temporary next_fire_at so the model validates, then recompute.
        from django.utils import timezone

        instance = serializer.save(user=self.request.user, next_fire_at=timezone.now())
        instance.next_fire_at = instance.compute_next_fire()
        instance.save(update_fields=["next_fire_at"])

    def perform_update(self, serializer):
        instance = serializer.save()
        instance.next_fire_at = instance.compute_next_fire()
        instance.save(update_fields=["next_fire_at"])

    @action(detail=False, methods=["post"], url_path="flush-due")
    def flush_due(self, request):
        """Deliver any overdue reminders for the current user (browser backup tick)."""
        results = fire_user_due(request.user)
        return Response({"fired": len(results), "results": results})

    @action(detail=True, methods=["post"])
    def test(self, request, pk=None):
        reminder = self.get_object()
        result = fire_reminder(reminder, force=True)
        return Response(result)


class VapidPublicKeyView(APIView):
    """Returns the VAPID public key so the browser can subscribe to push."""

    permission_classes = (AllowAny,)
    authentication_classes: list = []

    def get(self, _request):
        return Response({"public_key": vapid_public_key()})


class PushSubscriptionViewSet(viewsets.ModelViewSet):
    """Browser-managed push subscriptions for the current user.

    POST: register (idempotent — re-registering the same endpoint updates keys).
    DELETE: unregister.
    """

    serializer_class = PushSubscriptionSerializer
    permission_classes = (IsAuthenticated,)
    lookup_field = "id"

    def get_queryset(self):
        return PushSubscription.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        endpoint = serializer.validated_data["endpoint"]
        # Upsert by endpoint — the same browser re-subscribing must not duplicate.
        existing = PushSubscription.objects.filter(endpoint=endpoint).first()
        if existing:
            existing.user = request.user
            existing.p256dh = serializer.validated_data["p256dh"]
            existing.auth = serializer.validated_data["auth"]
            existing.user_agent = serializer.validated_data.get("user_agent", "")
            existing.save()
            return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)
        instance = serializer.save(user=request.user)
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="unsubscribe")
    def unsubscribe_by_endpoint(self, request):
        """Convenience: client can DELETE-by-endpoint without knowing the row id."""
        endpoint = request.data.get("endpoint")
        if not endpoint:
            return Response({"error": "endpoint required"}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = PushSubscription.objects.filter(
            user=request.user, endpoint=endpoint
        ).delete()
        return Response({"deleted": deleted})

    @action(detail=False, methods=["post"], url_path="test")
    def test_all(self, request):
        """Fires a test push to *all* of the current user's subscriptions."""
        result = send_test_push(request.user)
        return Response(result)


class FireDueRemindersView(APIView):
    """Internal endpoint hit by Cloud Scheduler (or `make tick` locally) every minute.

    Auth: `X-Internal-Secret` header must match settings.INTERNAL_SCHEDULER_SECRET.
    """

    permission_classes = (AllowAny,)
    authentication_classes: list = []

    def post(self, request):
        provided = request.headers.get("X-Internal-Secret", "")
        if not hmac.compare_digest(provided, settings.INTERNAL_SCHEDULER_SECRET):
            return Response(
                {"error": {"code": "forbidden", "message": "Bad scheduler secret."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        results = fire_all_due()
        return Response({"fired": len(results), "results": results})
