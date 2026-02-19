# Support Ticket System API - Backend implementation
import os
import sys
from datetime import datetime, timedelta
from django.db import models
from django.db.models import Count, Avg, Q
from django.utils import timezone
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from openai import OpenAI

# --- Models ---

class Ticket(models.Model):
    CATEGORY_CHOICES = [
        ('billing', 'Billing'),
        ('technical', 'Technical'),
        ('account', 'Account'),
        ('general', 'General'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    title = models.CharField(max_length=200, null=False, blank=False)
    description = models.TextField(null=False, blank=False)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status}] {self.title}"

# --- Serializers ---

class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = '__all__'

# --- Views ---

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    def get_queryset(self):
        queryset = Ticket.objects.all()
        category = self.request.query_params.get('category')
        priority = self.request.query_params.get('priority')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if category:
            queryset = queryset.filter(category=category)
        if priority:
            queryset = queryset.filter(priority=priority)
        if status:
            queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Aggregate statistics at the DB level
        base_stats = Ticket.objects.aggregate(
            total_tickets=Count('id'),
            open_tickets=Count('id', filter=Q(status='open')),
            # Avg per day - simple approach: total / days since first ticket or 1
            first_ticket=models.Min('created_at')
        )
        
        total = base_stats['total_tickets'] or 0
        first_ticket = base_stats['first_ticket'] or now
        days_active = max((now - first_ticket).days, 1)
        avg_per_day = round(total / days_active, 1)

        # Count by category/priority using annotate
        priority_data = Ticket.objects.values('priority').annotate(count=Count('priority'))
        category_data = Ticket.objects.values('category').annotate(count=Count('category'))

        priority_breakdown = {p[0]: 0 for p in Ticket.PRIORITY_CHOICES}
        for item in priority_data:
            priority_breakdown[item['priority']] = item['count']

        category_breakdown = {c[0]: 0 for c in Ticket.CATEGORY_CHOICES}
        for item in category_data:
            category_breakdown[item['category']] = item['count']

        return Response({
            "total_tickets": total,
            "open_tickets": base_stats['open_tickets'] or 0,
            "avg_tickets_per_day": avg_per_day,
            "priority_breakdown": priority_breakdown,
            "category_breakdown": category_breakdown
        })

class ClassifyView(APIView):
    def post(self, request):
        description = request.data.get('description', '')
        if not description:
            return Response({"error": "Description required"}, status=status.HTTP_400_BAD_REQUEST)

        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        prompt = f"""
        You are a support ticket classification assistant. 
        Given the following ticket description, suggest the most appropriate category and priority.
        
        Categories: billing, technical, account, general
        Priorities: low, medium, high, critical
        
        Description: {description}
        
        Respond ONLY with a valid JSON object:
        {{"suggested_category": "...", "suggested_priority": "..."}}
        """

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                timeout=5
            )
            import json
            result = json.loads(response.choices[0].message.content)
            return Response(result)
        except Exception as e:
            # Graceful failure: return defaults
            return Response({
                "suggested_category": "general",
                "suggested_priority": "medium",
                "error": str(e)
            }, status=status.HTTP_200_OK)
