REPORT_SCHEMA = """
Return only valid JSON with:
confidenceScore, clarityScore, persuasivenessScore, calmnessScore, structureScore,
summary, strengths, weakMoments, missedOpportunities, improvedResponses, drills,
nextRecommendation.
Scores must be integers from 0 to 100. Arrays should contain 3 concise, constructive items.
Do not promise guaranteed success. Do not provide therapy, legal, medical, or financial advice.
"""
