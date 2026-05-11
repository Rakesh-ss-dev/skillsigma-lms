from django.db import models

class Tenant(models.Model):
    name = models.CharField(max_length=100) # "TSE" or "SkillSigma"
    slug = models.SlugField(unique=True)     # "tse" or "skillsigma"
    domain = models.CharField(max_length=255, unique=True) # e.g., "tse.edu"
    
    # This is the "Brain" setup we discussed
    ai_persona_prompt = models.TextField(
        help_text="Instructions for the AI tone (e.g., 'You are a Senior Architect for professionals')"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name