from rest_framework.views import exception_handler


def envelope_exception_handler(exc, context):
    """Wrap DRF errors in a consistent { error: { code, message, details } } envelope."""
    response = exception_handler(exc, context)
    if response is None:
        return response

    detail = response.data
    code = getattr(exc, "default_code", "error")
    message = "Request failed."
    if isinstance(detail, dict) and "detail" in detail:
        message = str(detail["detail"])
        details = None
    else:
        details = detail

    response.data = {
        "error": {
            "code": code,
            "message": message,
            "details": details,
        }
    }
    return response
