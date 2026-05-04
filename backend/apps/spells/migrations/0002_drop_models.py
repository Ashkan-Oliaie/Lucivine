"""Drop the spells tables after quests.0002_copy_from_spells has migrated data over.

The spells app is kept in INSTALLED_APPS so this migration can run; once it
has been applied in every environment the app entry can be removed entirely.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("spells", "0001_initial"),
        ("quests", "0002_copy_from_spells"),
    ]

    operations = [
        migrations.DeleteModel(name="SpellCast"),
        migrations.DeleteModel(name="Spell"),
    ]
