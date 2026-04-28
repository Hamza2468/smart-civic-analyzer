"""
Database Seeder
===============
Populates the database with realistic demo complaints.
Run this ONCE after setting up the backend to get sample data.

Usage:
    python seed.py

This creates 20 realistic civic complaints across all categories,
so your dashboard looks populated and impressive during a demo.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from classifier import ComplaintClassifier

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

# Sample complaints — realistic civic issues
SAMPLE_COMPLAINTS = [
    {
        "title": "Dangerous pothole on Main Boulevard",
        "description": "There is a massive pothole on Main Boulevard near the bus stop. It has caused 3 motorcycle accidents this week alone. Very dangerous especially at night. The hole is almost 30cm deep.",
        "location": "Main Boulevard, Block 5, near Bus Stop 12",
        "submitted_by": "Ahmed Khan"
    },
    {
        "title": "No water supply for 4 days",
        "description": "Our entire street has had no water supply for 4 consecutive days. We have contacted the water authority multiple times but no action has been taken. There are elderly people and children who are suffering.",
        "location": "Street 7, Sector B, Green Town",
        "submitted_by": "Fatima Ali"
    },
    {
        "title": "Electricity outage every night",
        "description": "We are experiencing blackouts every night from 8pm to 2am for the past 2 weeks. The local transformer seems damaged. This is affecting businesses and home security.",
        "location": "Colony 4, Near Jamia Mosque",
        "submitted_by": "Muhammad Usman"
    },
    {
        "title": "Garbage pile-up near school",
        "description": "A massive garbage dump has formed right outside the primary school. The terrible smell is affecting students and the risk of disease is very high. Garbage has not been collected for over 2 weeks.",
        "location": "Government Primary School, Model Town Block C",
        "submitted_by": "Rabia Siddiqui"
    },
    {
        "title": "Suspicious activity near park at night",
        "description": "A group of unknown people have been gathering near the children's park every night after 11pm. There have been reports of theft in the area. Police presence is urgently needed.",
        "location": "Iqbal Park, Sector G-9",
        "submitted_by": "Imran Malik"
    },
    {
        "title": "Broken streetlights on entire road",
        "description": "All 12 streetlights on Hospital Road have been non-functional for 3 weeks. This is creating a dangerous situation especially for women and hospital patients traveling at night.",
        "location": "Hospital Road, full stretch from Chowk to Gate 3",
        "submitted_by": "Dr. Sarah Iqbal"
    },
    {
        "title": "Sewage overflow flooding the street",
        "description": "The main sewage line has burst and dirty water is overflowing onto the main street. Cars and pedestrians cannot pass. Strong smell and health hazard for residents.",
        "location": "Street 14, F-10/3",
        "submitted_by": "Khalid Mehmood"
    },
    {
        "title": "Park equipment broken, children injured",
        "description": "The swings and slides in the neighborhood park are broken. Two children were injured last week due to a broken swing. The park maintenance team has not responded to 3 previous complaints.",
        "location": "Children's Park, Defence Housing Authority Phase 2",
        "submitted_by": "Asma Tariq"
    },
    {
        "title": "Construction noise disrupting sleep",
        "description": "An unauthorized construction site nearby is running machinery 24 hours including 2am to 5am. Multiple families cannot sleep. The builders have no permit for night construction.",
        "location": "Plot 45, Street 9, Bahria Town",
        "submitted_by": "Naveed Hussain"
    },
    {
        "title": "Stray dogs attacking pedestrians",
        "description": "A large pack of approximately 15 stray dogs has taken over our street. They have bitten 2 children this week. Animal control needs to be called urgently before more people are hurt.",
        "location": "Block H, North Karachi",
        "submitted_by": "Zahida Perveen"
    },
    {
        "title": "Water pipe leaking for 2 weeks",
        "description": "A main water pipe has been leaking on our street for 14 days. Hundreds of gallons of water are being wasted daily. The leaking water is also damaging the road surface.",
        "location": "Street 22, I-8/2",
        "submitted_by": "Tariq Jameel"
    },
    {
        "title": "Dustbin overflowing near market",
        "description": "The public dustbin near the vegetable market has been overflowing for a week. Garbage is spread on the road. Flies and rats are a major concern for food hygiene.",
        "location": "Sabzi Mandi, near Main Chowk",
        "submitted_by": "Shaheen Akhtar"
    },
    {
        "title": "Bus route cancelled without notice",
        "description": "Route 22 bus service has not operated for 5 days without any official announcement. Thousands of daily commuters, including factory workers and students, are severely affected.",
        "location": "Route 22 — Industrial Area to City Center",
        "submitted_by": "Rana Asif"
    },
    {
        "title": "Mosquito infestation in standing water",
        "description": "There is standing dirty water in an open plot near our homes. It has become a mosquito breeding ground. Dengue cases are rising in our area. Urgent fumigation and drainage needed.",
        "location": "Open Plot 12-A, Gulshan-e-Iqbal Block 10",
        "submitted_by": "Dr. Mehwish Noor"
    },
    {
        "title": "Road under construction blocking hospital access",
        "description": "Road construction has blocked the main access road to District Hospital. Ambulances are being delayed. This is a life-threatening situation. Emergency access must be maintained.",
        "location": "Main Road, District Hospital Access Route",
        "submitted_by": "Hospital Administration"
    },
    {
        "title": "Electric pole sparking dangerously",
        "description": "An electric pole on our street has exposed wires that are sparking during wind. This is extremely dangerous and could cause electrocution or fire. Immediate attention from WAPDA required.",
        "location": "Pole No. 47, Street 3, Johar Town",
        "submitted_by": "Muhammad Bilal"
    },
    {
        "title": "Tree fallen blocking entire road",
        "description": "A large tree fell during last night's storm and is completely blocking the main road. Emergency vehicles cannot pass. Chainsaw team needed urgently.",
        "location": "Canal Road, near Jilani Park Gate",
        "submitted_by": "Traffic Police Officer (Reported)"
    },
    {
        "title": "No bus shelter at major stop",
        "description": "The bus stop outside Government Girls College has no shelter. Hundreds of students and women stand in sun and rain every day. A shelter has been requested for 2 years with no action.",
        "location": "Govt. Girls College Bus Stop, University Road",
        "submitted_by": "Student Council Representative"
    },
    {
        "title": "Smoke from burning waste",
        "description": "The municipal waste collection point is burning garbage daily creating toxic smoke. The smoke is affecting a school and a hospital nearby. This is illegal and a serious health hazard.",
        "location": "Waste Collection Point, Near Jinnah Hospital",
        "submitted_by": "Nasreen Bano"
    },
    {
        "title": "Cracked road causing flooding",
        "description": "The road surface has multiple large cracks and has sunk in places. During rain, water accumulates for days making it impossible to walk or drive. Several people have fallen.",
        "location": "Sector F-7, Margalla Road stretch",
        "submitted_by": "Residents Committee"
    }
]

# Statuses to randomly assign (makes dashboard look realistic)
STATUSES = [
    "Open", "Open", "Open",         # Most are open
    "In Progress", "In Progress",    # Some in progress
    "Resolved"                        # A few resolved
]

def seed():
    print("\n🌱 Starting database seed...")
    print("=" * 50)

    db = SessionLocal()
    classifier = ComplaintClassifier()

    # Clear existing data (optional — comment out to keep existing)
    existing = db.query(models.Complaint).count()
    if existing > 0:
        choice = input(f"\n⚠️  Database already has {existing} complaints. Clear and reseed? (y/n): ")
        if choice.lower() == 'y':
            db.query(models.Complaint).delete()
            db.commit()
            print("🗑️  Existing data cleared.")
        else:
            print("⏭️  Keeping existing data and adding new records...")

    import random
    random.seed(42)

    created = 0
    for i, complaint_data in enumerate(SAMPLE_COMPLAINTS):
        # AI classify
        ai_result = classifier.classify(complaint_data["description"])

        # Assign a realistic status (newer complaints more likely to be Open)
        if i < 10:
            status = random.choice(["Open", "Open", "In Progress"])
        elif i < 16:
            status = random.choice(["Open", "In Progress", "Resolved"])
        else:
            status = "Resolved"

        db_complaint = models.Complaint(
            title=complaint_data["title"],
            description=complaint_data["description"],
            location=complaint_data["location"],
            submitted_by=complaint_data["submitted_by"],
            category=ai_result["category"],
            priority=ai_result["priority"],
            confidence=ai_result["confidence"],
            status=status
        )
        db.add(db_complaint)

        print(f"  ✅ [{i+1:02d}] {complaint_data['title'][:50]}")
        print(f"        → {ai_result['category']} | {ai_result['priority']} | {ai_result['confidence']*100:.0f}% confident")
        created += 1

    db.commit()
    db.close()

    print(f"\n{'='*50}")
    print(f"✅ Seed complete! {created} complaints added to the database.")
    print(f"\n📊 Now open your dashboard at: http://localhost:3000")
    print(f"📡 Or view via API at: http://localhost:8000/complaints/")


if __name__ == "__main__":
    seed()