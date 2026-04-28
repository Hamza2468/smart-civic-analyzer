"""
API Tests
=========
Run these tests to verify all endpoints work correctly.

Usage:
    # Start your backend first, then run:
    pip install httpx pytest
    pytest test_api.py -v
"""

import pytest  # type: ignore[import-not-found]
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealth:
    def test_root(self):
        response = client.get("/")
        assert response.status_code == 200
        assert "running" in response.json()["message"]

    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestComplaints:
    def test_create_complaint(self):
        """Test that creating a complaint returns AI classification."""
        payload = {
            "title": "Big pothole on Main Road",
            "description": "There is a dangerous pothole near the school. Multiple accidents.",
            "location": "Main Road, Block 5",
            "submitted_by": "Test User"
        }
        response = client.post("/complaints/", json=payload)
        assert response.status_code == 200
        data = response.json()

        # Check all required fields are present
        assert "id" in data
        assert "category" in data
        assert "priority" in data
        assert "confidence" in data
        assert data["status"] == "Open"

        # Check AI correctly classified this as Roads
        assert "Road" in data["category"]

        return data["id"]

    def test_get_all_complaints(self):
        response = client.get("/complaints/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_filter_by_status(self):
        response = client.get("/complaints/?status=Open")
        assert response.status_code == 200
        data = response.json()
        for complaint in data:
            assert complaint["status"] == "Open"

    def test_update_status(self):
        # Create a complaint first
        payload = {
            "title": "Test complaint for status update",
            "description": "Water pipe leaking on our street, no water for days.",
        }
        create_response = client.post("/complaints/", json=payload)
        complaint_id = create_response.json()["id"]

        # Update status
        update_response = client.patch(
            f"/complaints/{complaint_id}/status",
            json={"status": "In Progress"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["status"] == "In Progress"

    def test_invalid_status(self):
        response = client.patch(
            "/complaints/1/status",
            json={"status": "InvalidStatus"}
        )
        assert response.status_code == 400

    def test_not_found(self):
        response = client.get("/complaints/99999")
        assert response.status_code == 404


class TestClassifier:
    def test_roads_classification(self):
        """Pothole → Roads & Infrastructure"""
        response = client.post("/complaints/", json={
            "title": "Pothole",
            "description": "Huge pothole on the road, very dangerous for vehicles."
        })
        assert "Road" in response.json()["category"]

    def test_water_classification(self):
        """Water issue → Water Supply"""
        response = client.post("/complaints/", json={
            "title": "No water",
            "description": "No water supply for 3 days, pipe burst, flooding everywhere."
        })
        assert "Water" in response.json()["category"]

    def test_electricity_classification(self):
        """Power outage → Electricity"""
        response = client.post("/complaints/", json={
            "title": "Blackout",
            "description": "Electricity outage since morning, no power, blackout in entire area."
        })
        assert "Electricity" in response.json()["category"]

    def test_critical_priority(self):
        """Emergency keywords → Critical priority"""
        response = client.post("/complaints/", json={
            "title": "Emergency",
            "description": "Sparking electric wire, fire risk, very dangerous, emergency!"
        })
        assert response.json()["priority"] == "Critical"


class TestAnalytics:
    def test_summary(self):
        response = client.get("/analytics/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "by_status" in data
        assert "by_category" in data
        assert "by_priority" in data


if __name__ == "__main__":
    print("Running tests...")
    pytest.main([__file__, "-v", "--tb=short"])