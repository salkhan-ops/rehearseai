from statistics import mean
from uuid import uuid4
from app.models.analytics import MetricScores, PerformanceAnalytics, ReasoningTree
from app.models.message import Message
from app.models.report import Report
from app.models.session import Session
from app.utils.timestamps import utc_now_iso


def clamp(value: float) -> int:
    return max(0, min(100, round(value)))


FILLER_WORDS = {"um", "uh", "like", "basically", "actually", "just", "sort of", "kind of", "maybe"}


class AnalyticsService:
    def build(self, session: Session, report: Report, messages: list[Message], previous_sessions_count: int = 0) -> PerformanceAnalytics:
        user_messages = [message for message in messages if message.role == "user"]
        if not user_messages:
            user_messages = [Message(id="synthetic", role="user", content=session.goal, createdAt=session.createdAt)]

        avg_words = mean([len(message.content.split()) for message in user_messages])
        joined_text = " ".join(message.content.lower() for message in user_messages)
        filler_count = sum(joined_text.count(word) for word in FILLER_WORDS)
        vague_count = sum(joined_text.count(word) for word in ["things", "stuff", "good", "nice", "many", "some", "probably"])
        defensive_count = sum(joined_text.count(word) for word in ["but", "actually", "to be honest", "i disagree", "that's not"])
        evidence_count = sum(joined_text.count(word) for word in ["because", "example", "measured", "result", "data", "evidence"])
        specificity = mean([min(100, len(set(message.content.lower().split())) * 3.2) for message in user_messages])
        structure_bonus = 8 if any(marker in " ".join(m.content.lower() for m in user_messages) for marker in ["first", "second", "because", "therefore", "example"]) else 0

        metrics = MetricScores(
            confidence=report.confidenceScore,
            clarity=report.clarityScore,
            logicalConsistency=clamp(report.structureScore + structure_bonus),
            persuasiveness=report.persuasivenessScore,
            emotionalComposure=report.calmnessScore,
            responseStructure=report.structureScore,
            brevityEfficiency=clamp(92 - max(0, avg_words - 38) * 1.2),
            criticalThinking=clamp((report.clarityScore + report.structureScore + specificity) / 3),
            adaptability=clamp(report.calmnessScore - 3 + len(user_messages) * 2),
            listeningAccuracy=clamp(report.clarityScore - 2),
            directness=clamp(88 - max(0, avg_words - 32)),
            handlingInterruptions=clamp(report.calmnessScore - (8 if session.difficulty == "Brutal" else 2)),
            recoveryAfterPressure=clamp((report.calmnessScore + report.confidenceScore) / 2),
            intellectualDepth=clamp((specificity + report.structureScore) / 2),
            reasoningQuality=clamp((report.structureScore + report.clarityScore + specificity) / 3),
        )

        radar_metrics = [
            ("Confidence", metrics.confidence, 82),
            ("Clarity", metrics.clarity, 84),
            ("Reasoning", metrics.reasoningQuality, 86),
            ("Composure", metrics.emotionalComposure, 84),
            ("Persuasion", metrics.persuasiveness, 83),
            ("Adaptability", metrics.adaptability, 80),
        ]
        radar_data = [
            {"metric": label, "user": value, "target": target, "previous": clamp(value - 5 + previous_sessions_count)}
            for label, value, target in radar_metrics
        ]

        timeline_data = []
        pressure_data = []
        efficiency_data = []
        resilience_data = []
        critical_moments = []
        for index, message in enumerate(user_messages, start=1):
            words = len(message.content.split())
            evidence = min(18, message.content.lower().count("because") * 8 + message.content.lower().count("example") * 6)
            score = clamp((metrics.clarity + metrics.confidence + metrics.reasoningQuality) / 3 + evidence - index * 1.5)
            pressure = clamp(100 - score + (12 if session.difficulty == "Brutal" and index % 2 == 0 else 0))
            stress = clamp(pressure + max(0, words - 55) * 0.7 + filler_count)
            recovery = clamp(metrics.recoveryAfterPressure + index * 2 - stress * 0.08)
            timeline_data.append({
                "turn": index,
                "performance": score,
                "reasoning": clamp(score + evidence / 2),
                "composure": clamp(metrics.emotionalComposure - pressure * 0.12),
                "pressure": pressure,
                "confidence": clamp(metrics.confidence - pressure * 0.2),
                "event": "interruption" if session.difficulty == "Brutal" and index % 2 == 0 else "response",
            })
            pressure_data.append({
                "turn": index,
                "confidence": clamp(metrics.confidence - pressure * 0.2),
                "recovery": recovery,
                "stability": clamp(metrics.emotionalComposure - pressure * 0.16),
                "stress": stress,
            })
            resilience_data.append({
                "turn": index,
                "pressureResistance": clamp(100 - stress * 0.55),
                "emotionalRecovery": recovery,
                "interruptionRecovery": clamp(metrics.handlingInterruptions + (4 if index % 2 else -4)),
            })
            efficiency_data.append({
                "turn": index,
                "brevity": clamp(100 - max(0, words - 34) * 1.5),
                "directness": clamp(metrics.directness - max(0, words - 42)),
                "completion": clamp(score + 4),
                "words": words,
            })
            if stress > 38 or score < 70:
                critical_moments.append({
                    "turn": index,
                    "type": "pressure shift" if stress > 38 else "reasoning dip",
                    "signal": "You rushed or broadened the answer under pressure." if stress > 38 else "Logic weakened when evidence was needed.",
                    "coaching": "Pause, clarify the concern, then answer with one proof point.",
                })

        heatmap_data = [
            {"weakness": "Unsupported claims", "frequency": max(1, 5 - structure_bonus // 3), "severity": 100 - metrics.reasoningQuality},
            {"weakness": "Over-explaining", "frequency": clamp(avg_words / 12), "severity": 100 - metrics.brevityEfficiency},
            {"weakness": "Pressure recovery", "frequency": 3 if session.difficulty == "Brutal" else 1, "severity": 100 - metrics.recoveryAfterPressure},
            {"weakness": "Vague evidence", "frequency": 4, "severity": 100 - metrics.intellectualDepth},
            {"weakness": "Missed framing", "frequency": 3, "severity": 100 - metrics.responseStructure},
        ]

        trend_data = [
            {"session": f"S{max(1, previous_sessions_count - 3 + index)}", "overall": clamp(mean([m[1] for m in radar_metrics]) - (4 - index) * 3), "reasoning": clamp(metrics.reasoningQuality - (4 - index) * 2)}
            for index in range(1, 6)
        ]

        tree = ReasoningTree(
            id=str(uuid4()),
            sessionId=session.id,
            question=f"Core {session.practiceType.lower()} challenge",
            rootNode=user_messages[-1].content[:160],
            branches=[
                {"id": "evidence", "label": "Evidence-backed path", "quality": "strong", "consequence": "Increases credibility and makes the answer harder to dismiss."},
                {"id": "generic", "label": "Generic answer path", "quality": "weak", "consequence": "The listener may lose interest because the claim feels interchangeable."},
                {"id": "defensive", "label": "Defensive path", "quality": "risky", "consequence": "Can signal insecurity under pressure."},
                {"id": "clarifying", "label": "Clarifying path", "quality": "strong", "consequence": "Buys time and improves answer precision."},
            ],
            outcomes=[
                {"from": "evidence", "to": "credibility"},
                {"from": "generic", "to": "low-trust"},
                {"from": "defensive", "to": "pressure-risk"},
                {"from": "clarifying", "to": "strategic-control"},
            ],
            createdAt=utc_now_iso(),
        )

        replay_items = [
            {
                "turn": index,
                "response": message.content,
                "analysis": "This answer is strongest when it moves from claim to evidence to outcome.",
                "pressureState": "stable" if len(message.content.split()) < 50 else "rushed",
                "criticalMoment": "Potential over-explaining under pressure." if len(message.content.split()) > 55 else "Controlled response window.",
                "decisionTurningPoint": "The listener needed proof before more explanation.",
                "betterConcise": "I would frame it as problem, action, and measurable result.",
                "morePersuasive": "The strongest proof is a specific example where I delivered under similar constraints.",
                "executiveStyle": "The decision comes down to risk reduction, speed, and measurable impact.",
                "technicalVersion": "I would define the constraint, isolate the assumption, test it, and report the metric movement.",
                "emotionallyIntelligent": "I hear the concern. I would clarify the risk first, then answer directly.",
            }
            for index, message in enumerate(user_messages[:5], start=1)
        ]
        pressure_stability = clamp(mean([item["stability"] for item in pressure_data]) if pressure_data else metrics.emotionalComposure)
        emotional_recovery = clamp(mean([item["recovery"] for item in pressure_data]) if pressure_data else metrics.recoveryAfterPressure)
        resilience_score = clamp((pressure_stability + emotional_recovery + metrics.handlingInterruptions) / 3)
        challenge_type = {
            "Job Interview": "hostile interviewer",
            "Presentation / Public Speaking": "confused audience",
            "Panel Discussion": "aggressive panel",
            "Thesis Defense": "hostile Q&A",
            "Salary Negotiation": "impatient executive",
            "Difficult Conversation": "emotional pressure",
            "Teaching Session": "confused audience",
            "Sales Pitch": "skeptical customer",
        }.get(session.practiceType, "rapid-fire questioning")

        return PerformanceAnalytics(
            id=str(uuid4()),
            sessionId=session.id,
            userId=session.userId,
            metrics=metrics,
            confidenceMetrics={
                "confidenceFluctuation": clamp(max([item["confidence"] for item in pressure_data]) - min([item["confidence"] for item in pressure_data])) if pressure_data else 0,
                "hesitationRisk": clamp(filler_count * 9 + vague_count * 4),
                "recoveryAfterChallenge": emotional_recovery,
            },
            pressureMetrics={
                "pressureStabilityScore": pressure_stability,
                "emotionalRecoveryScore": emotional_recovery,
                "resilienceScore": resilience_score,
                "stressSpikes": len([item for item in pressure_data if item["stress"] > 42]),
                "pressureResistance": clamp(100 - mean([item["stress"] for item in pressure_data])) if pressure_data else resilience_score,
            },
            reasoningMetrics={
                "logicalConsistency": metrics.logicalConsistency,
                "reasoningQuality": metrics.reasoningQuality,
                "unsupportedAssumptionRisk": clamp(80 - evidence_count * 8 + vague_count * 4),
                "conceptualDepth": metrics.intellectualDepth,
            },
            communicationMetrics={
                "brevityEfficiency": metrics.brevityEfficiency,
                "directness": metrics.directness,
                "fillerWordCount": filler_count,
                "averageWordsPerTurn": round(avg_words, 1),
                "overExplanationRisk": clamp(max(0, avg_words - 42) * 2.4),
            },
            benchmarkMetrics={
                "clarityPercentile": clamp(metrics.clarity - 4 + previous_sessions_count),
                "reasoningPercentile": clamp(metrics.reasoningQuality - 2 + previous_sessions_count),
                "pressureHandlingPercentile": clamp(resilience_score - 3 + previous_sessions_count),
                "topPerformerGap": clamp(88 - mean([metrics.clarity, metrics.reasoningQuality, resilience_score])),
                "benchmarkNotes": [
                    "Top performers answer with fewer unsupported claims.",
                    "High performers recover from interruptions before adding detail.",
                    "Benchmarks are anonymized and never expose private user data.",
                ],
            },
            adaptivePersona={
                "currentPressureLevel": "high" if session.difficulty == "Brutal" or resilience_score > 78 else "moderate",
                "detectedPatterns": {
                    "hesitation": filler_count,
                    "vagueness": vague_count,
                    "defensiveness": defensive_count,
                    "overExplaining": avg_words > 48,
                    "logicalInconsistencyRisk": metrics.logicalConsistency < 72,
                },
                "nextBehavior": "increase conceptual depth" if metrics.reasoningQuality > 80 else "challenge weak logic and ask for evidence",
                "safetyAdjustment": "soften slightly if composure drops below 55; never insult or shame.",
            },
            resilienceData=resilience_data,
            challengeResult={
                "id": str(uuid4()),
                "challengeType": challenge_type,
                "survivalScore": clamp((metrics.confidence + metrics.clarity + resilience_score) / 3),
                "pressureEnduranceScore": resilience_score,
                "reasoningStabilityScore": metrics.reasoningQuality,
                "interruptionRecoveryScore": metrics.handlingInterruptions,
                "createdAt": utc_now_iso(),
            },
            progression={
                "streak": min(30, max(1, previous_sessions_count + 1)),
                "skillLevel": "Strategic Operator" if resilience_score >= 82 else "Pressure Builder" if resilience_score >= 70 else "Foundation",
                "confidenceEvolution": clamp(metrics.confidence - 65),
                "reasoningEvolution": clamp(metrics.reasoningQuality - 65),
                "communicationIntelligenceGrowth": clamp(mean([metrics.clarity, metrics.directness, metrics.brevityEfficiency]) - 65),
                "achievements": [
                    "Handled interruption without losing clarity" if metrics.handlingInterruptions > 72 else "Completed pressure simulation",
                    f"Improved logical consistency by {max(1, metrics.logicalConsistency - 68)}%",
                    f"Completed {session.difficulty} {session.practiceType} level 1",
                ],
            },
            shareHighlights={
                "title": "Cognitive Performance Report",
                "confidenceScore": metrics.confidence,
                "pressureHandling": resilience_score,
                "communicationIntelligence": clamp(mean([metrics.clarity, metrics.directness, metrics.brevityEfficiency])),
                "reasoningStrength": metrics.reasoningQuality,
                "emotionalComposure": metrics.emotionalComposure,
                "persuasiveness": metrics.persuasiveness,
            },
            criticalMoments=critical_moments or [{
                "turn": 1,
                "type": "control point",
                "signal": "You stayed stable enough to keep the answer moving.",
                "coaching": "Next time, add one sharper proof point earlier.",
            }],
            radarData=radar_data,
            timelineData=timeline_data,
            pressureData=pressure_data,
            heatmapData=heatmap_data,
            efficiencyData=efficiency_data,
            trendData=trend_data,
            reasoningSummary="Your strongest answers connect pressure to structure. Your weaker moments appear when claims arrive before evidence.",
            reasoningStrengths=["Clear intent under pressure", "Good recovery when challenged", "Useful strategic framing when you slow down"],
            reasoningGaps=["Some conclusions need stronger evidence", "A few answers defend before clarifying", "Reasoning can become broad when pressure rises"],
            missingEvidence=["Quantified outcomes", "Specific examples", "Trade-off explanation"],
            strongerStructures=["Claim -> evidence -> outcome", "Clarify -> answer -> verify concern", "Context -> action -> result -> lesson"],
            coachingSuggestions=["Pause before answering skeptical questions", "Name the assumption you are making", "Use one concrete example before adding explanation"],
            replayItems=replay_items,
            decisionTrees=[tree],
            historicalInsights=[
                f"Confidence is tracking {max(0, metrics.confidence - 70)} points above the baseline for this scenario.",
                "Reasoning quality improves when answers use evidence before conclusions.",
                "Brevity is the highest leverage improvement area if responses exceed 45 words.",
            ],
            milestones=["Complete 3 sessions this week", "Reach 85+ reasoning quality", "Reduce over-explaining for two sessions in a row"],
            createdAt=utc_now_iso(),
        )
