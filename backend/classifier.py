"""
AI Complaint Classifier
========================
The brain of the system. Uses a keyword-based approach (no training needed)
combined with an optional Hugging Face zero-shot classifier for better accuracy.

TWO MODES:
  1. Simple Mode (default)  → keyword rules, works offline, instant
  2. Advanced Mode          → Hugging Face zero-shot-classification (downloads ~1GB model)

For your internship demo, Simple Mode is perfectly impressive.
You can enable Advanced Mode after understanding the basics.
"""

import re
from typing import Dict, Any

# ── Category Definitions ──────────────────────────────────────────────────────
# Each category has keywords. The complaint text is matched against these.

CATEGORY_KEYWORDS = {
    "Roads & Infrastructure": [
        "road", "pothole", "pavement", "sidewalk", "bridge", "street",
        "highway", "traffic", "signal", "streetlight", "lamp", "broken road",
        "construction", "footpath", "manhole", "crack"
    ],
    "Water Supply": [
        "water", "pipe", "leak", "flood", "drainage", "sewage", "tap",
        "shortage", "contamination", "dirty water", "overflow", "drain",
        "supply", "plumbing", "burst pipe", "no water"
    ],
    "Electricity": [
        "electricity", "power", "electric", "light", "outage", "blackout",
        "voltage", "transformer", "wire", "pole", "meter", "generator",
        "load shedding", "sparking", "short circuit"
    ],
    "Waste Management": [
        "garbage", "trash", "waste", "litter", "dumping", "bin", "recycling",
        "smell", "stench", "rubbish", "sanitation", "cleanliness", "sweep",
        "collection", "disposal", "filth"
    ],
    "Public Safety": [
        "crime", "theft", "robbery", "unsafe", "dangerous", "violence",
        "harassment", "accident", "security", "police", "emergency",
        "assault", "threat", "drug", "suspicious", "vandalism"
    ],
    "Parks & Recreation": [
        "park", "playground", "garden", "tree", "grass", "bench",
        "sports", "recreation", "field", "maintenance", "green space", "plant"
    ],
    "Noise Pollution": [
        "noise", "loud", "sound", "music", "horn", "speaker",
        "construction noise", "disturbance", "nuisance", "party"
    ],
    "Health & Sanitation": [
        "health", "hospital", "clinic", "disease", "mosquito", "rats",
        "pest", "hygiene", "pollution", "air quality", "smoke", "odor"
    ],
    "Transport": [
        "bus", "transport", "route", "commute", "metro", "taxi",
        "rickshaw", "public transport", "schedule", "station", "stop"
    ],
    "Other": []  # Fallback
}

# ── Priority Rules ─────────────────────────────────────────────────────────────
# Based on urgency keywords and category, assign priority.

CRITICAL_KEYWORDS = [
    "fire", "explosion", "death", "dead", "dying", "emergency", "urgent",
    "dangerous", "collapse", "flooding", "sparking", "accident", "crime",
    "robbery", "assault", "violence", "contamination", "injury", "injured"
]

HIGH_KEYWORDS = [
    "broken", "not working", "unsafe", "no water", "no electricity",
    "blackout", "outage", "pothole", "blockage", "overflow", "severe",
    "major", "serious", "multiple", "weeks"
]

MEDIUM_KEYWORDS = [
    "maintenance", "repair", "fix", "issue", "problem", "complaint",
    "damage", "leak", "noise", "smell", "days"
]

# LOW is the default fallback


class ComplaintClassifier:
    """
    Classifies complaint text into a category and priority level.
    
    Usage:
        clf = ComplaintClassifier()
        result = clf.classify("There is a big pothole on Main Street, dangerous for bikes")
        # Returns: {"category": "Roads & Infrastructure", "priority": "High", "confidence": 0.87}
    """

    def __init__(self, use_advanced=False):
        self.use_advanced = use_advanced
        self._advanced_model = None

        if use_advanced:
            self._load_advanced_model()

    def _load_advanced_model(self):
        """
        Load Hugging Face zero-shot classifier.
        Requires: pip install transformers torch
        Downloads ~1.5GB model on first run.
        """
        try:
            from transformers import pipeline  # type: ignore[import-not-found]
            print("⏳ Loading AI model... (first time takes 1-2 minutes)")
            self._advanced_model = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli"
            )
            print("✅ AI model loaded!")
        except ImportError:
            print("⚠️  transformers not installed. Falling back to keyword mode.")
            self.use_advanced = False
        except Exception as e:
            print(f"⚠️  Could not load model: {e}. Falling back to keyword mode.")
            self.use_advanced = False

    def is_ready(self) -> bool:
        return True  # Always ready (keyword mode is always available)

    def _clean_text(self, text: str) -> str:
        """Lowercase and clean the text."""
        return text.lower().strip()

    def _classify_category_keywords(self, text: str) -> tuple[str, float]:
        """
        Match text against category keyword lists.
        Returns (category, confidence_score).
        """
        text = self._clean_text(text)
        scores = {}

        for category, keywords in CATEGORY_KEYWORDS.items():
            if category == "Other":
                continue
            count = sum(1 for kw in keywords if kw in text)
            if count > 0:
                # Score = matched keywords / total keywords (normalized)
                scores[category] = count / len(keywords)

        if not scores:
            return "Other", 0.5

        best_category = max(scores, key=scores.get)
        # Scale confidence: more matches = higher confidence (cap at 0.95)
        raw_score = scores[best_category]
        confidence = min(0.5 + raw_score * 5, 0.95)
        return best_category, round(confidence, 2)

    def _classify_category_advanced(self, text: str) -> tuple[str, float]:
        """
        Use Hugging Face zero-shot classification.
        More accurate but requires downloading a large model.
        """
        candidate_labels = list(CATEGORY_KEYWORDS.keys())
        candidate_labels.remove("Other")

        result = self._advanced_model(text, candidate_labels)
        category = result["labels"][0]
        confidence = round(result["scores"][0], 2)
        return category, confidence

    def _classify_priority(self, text: str, category: str) -> str:
        """
        Determine priority based on keywords and category.
        Priority levels: Critical → High → Medium → Low
        """
        text = self._clean_text(text)

        # Check for critical keywords first
        if any(kw in text for kw in CRITICAL_KEYWORDS):
            return "Critical"

        # Public Safety is always at least High
        if category == "Public Safety":
            return "High"

        # Check high keywords
        if any(kw in text for kw in HIGH_KEYWORDS):
            return "High"

        # Check medium keywords
        if any(kw in text for kw in MEDIUM_KEYWORDS):
            return "Medium"

        # Default
        return "Low"

    def classify(self, description: str) -> Dict[str, Any]:
        """
        Main classification method.
        
        Args:
            description: The complaint text
            
        Returns:
            dict with keys: category, priority, confidence
        """
        if self.use_advanced and self._advanced_model:
            category, confidence = self._classify_category_advanced(description)
        else:
            category, confidence = self._classify_category_keywords(description)

        priority = self._classify_priority(description, category)

        return {
            "category": category,
            "priority": priority,
            "confidence": confidence
        }


# ── Quick Test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    clf = ComplaintClassifier()

    test_complaints = [
        "There is a huge pothole on Main Road near the school. Very dangerous for motorbikes.",
        "No water supply in our area for 3 days. Very urgent please fix.",
        "Garbage has not been collected for 2 weeks, terrible smell everywhere.",
        "Electricity gone since morning, no power in the whole block.",
        "Suspicious person seen stealing motorcycles at night near Block 5."
    ]

    print("\n🧠 Complaint Classification Test\n" + "=" * 50)
    for complaint in test_complaints:
        result = clf.classify(complaint)
        print(f"\n📝 Complaint: {complaint[:60]}...")
        print(f"   Category   : {result['category']}")
        print(f"   Priority   : {result['priority']}")
        print(f"   Confidence : {result['confidence'] * 100:.0f}%")