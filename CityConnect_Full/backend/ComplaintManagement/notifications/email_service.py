
from django.conf import settings
from django.core.mail import send_mail


def send_ticket_email(recipient_email, subject, message):
    """
    Send an email notification about a complaint ticket.

    Returns:
        True  - email sent successfully
        False - recipient has no email address or sending failed
    """
    if not recipient_email:
        return False

    try:
        sent_count = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        return sent_count == 1

    except Exception:
        return False
