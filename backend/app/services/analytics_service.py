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


def _compute_streak(completed_dates: list[str]) -> int:
    """Count consecutive calendar days ending today from a list of ISO date strings."""
    if not completed_dates:
        return 0
    from datetime import date, timedelta
    unique = sorted(set(completed_dates), reverse=True)
    streak = 0
    expected = date.today()
    for day_str in unique:
        try:
            day = date.fromisoformat(day_str)
        except ValueError:
            continue
        if day == expected or day == expected - timedelta(days=1) and streak == 0:
            streak += 1
            expected = day - timedelta(days=1)
        elif day == expected:
            streak += 1
            expected = day - timedelta(days=1)
        else:
            break
    return max(1, streak)


class AnalyticsService:
    def build(self, session: Session, report: Report, messages: list[Message], previous_sessions_count: int = 0, historical: dict | None = None) -> PerformanceAnalytics:
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
            {"weakness": "Vague evidence", "frequency": max(1, vague_count), "severity": 100 - metrics.intellectualDepth},
            {"weakness": "Missed framing", "frequency": max(1, max(0, len(user_messages) - structure_bonus)), "severity": 100 - metrics.responseStructure},
        ]

        # Use real stored session scores when available; fall back to honest "not enough data" stub
        session_scores = historical.get("sessionScores") if historical else None
        current_overall = round(mean([m[1] for m in radar_metrics]), 1)
        if session_scores and len(session_scores) >= 2:
            sorted_scores = sorted(session_scores.values(), key=lambda x: x.get("createdAt", ""))
            trend_data = [
                {
                    "session": f"S{i + 1}",
                    "overall": clamp(s.get("overall", current_overall)),
                    "reasoning": clamp(s.get("reasoning", metrics.reasoningQuality)),
                }
                for i, s in enumerate(sorted_scores[-5:])
            ]
        else:
            # Not enough history yet — only show current session, no fabricated prior points
            trend_data = [{"session": "This session", "overall": clamp(current_overall), "reasoning": clamp(metrics.reasoningQuality)}]

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

        def _replay_for_turn(index: int, message: Message) -> dict:
            words = message.content.split()
            word_count = len(words)
            text = message.content.lower()
            has_evidence = any(w in text for w in ["because", "example", "measured", "result", "data", "evidence", "specifically"])
            has_filler = sum(text.count(w) for w in FILLER_WORDS) > 2
            is_long = word_count > 55
            is_short = word_count < 15
            turn_pressure = clamp(100 - (timeline_data[index - 1]["performance"] if index <= len(timeline_data) else 70))

            if is_long and not has_evidence:
                analysis = "Long answer without a clear proof point — the listener may disengage before the conclusion."
                concise = "Lead with one claim, back it with one specific example, then stop."
                persuasive = "Add a concrete outcome: 'I did X, and the result was Y.'"
            elif is_short:
                analysis = "Very brief — you may have the right instinct but not enough support to land it."
                concise = "This is already tight. Try adding one fact to anchor the claim."
                persuasive = "Expand with one example or a number to make this stick."
            elif has_filler and not has_evidence:
                analysis = "Filler words and no evidence — this is the pattern that signals uncertainty to an interviewer."
                concise = "Cut the hedge words. State the claim directly, then support it."
                persuasive = "Replace one 'basically' or 'kind of' with a specific fact."
            elif has_evidence:
                analysis = "Good — you backed the claim with something specific. This is the strongest pattern."
                concise = "Already well-structured. Could tighten by removing any trailing qualifiers."
                persuasive = "This answer is close to its strongest form. Add one measurable outcome if you can."
            else:
                analysis = "Reasonable answer but the claim is unsupported — the listener can agree or disagree without evidence."
                concise = "State the claim in one sentence, then add one example in the next."
                persuasive = "Specificity beats repetition — replace a general point with a real case."

            pressure_state = "under pressure" if turn_pressure > 50 else "stable"
            turning_point = "The question needed evidence before more framing." if not has_evidence else "Strong moment — you gave the listener something to hold onto."

            return {
                "turn": index,
                "response": message.content,
                "analysis": analysis,
                "pressureState": pressure_state,
                "criticalMoment": f"Turn {index}: {analysis.split('—')[0].strip()}",
                "decisionTurningPoint": turning_point,
                "betterConcise": concise,
                "morePersuasive": persuasive,
                "executiveStyle": "Lead with the outcome, then the action that produced it." if not is_short else "This length is executive-ready. Add one number.",
                "technicalVersion": "Define the constraint, state your action, report the metric." if not has_evidence else "Already specific — good technical clarity.",
                "emotionallyIntelligent": "Acknowledge the concern first, then answer with evidence." if turn_pressure > 45 else "Composed delivery — reinforce with a concrete example.",
            }

        replay_items = [_replay_for_turn(i, m) for i, m in enumerate(user_messages[:5], start=1)]
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
                "clarityScore": metrics.clarity,
                "reasoningScore": metrics.reasoningQuality,
                "pressureHandlingScore": resilience_score,
                "topPerformerGap": clamp(88 - mean([metrics.clarity, metrics.reasoningQuality, resilience_score])),
                "benchmarkNotes": [
                    "Top performers lead with evidence before conclusions.",
                    "High performers recover from interruptions without over-explaining.",
                    "These scores are based on your session only — cross-user benchmarks are not yet available.",
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
                "streak": _compute_streak(historical.get("completedDates", []) if historical else []),
                "totalSessions": previous_sessions_count + 1,
                "skillLevel": "Strategic Operator" if resilience_score >= 82 else "Pressure Builder" if resilience_score >= 70 else "Foundation",
                "achievements": [
                    "Handled interruption without losing clarity" if metrics.handlingInterruptions > 72 else "Completed a full pressure simulation",
                    f"{'Backed claims with evidence' if evidence_count > 2 else 'Identified evidence as the next focus area'}",
                    f"Completed {session.difficulty} difficulty — {session.practiceType}",
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
                f"Your confidence score this session: {metrics.confidence}/100{'. That is above your recent average.' if historical and metrics.confidence > historical.get('rollingAverages', {}).get('confidence', 0) else '.'}",
                f"{'Filler words appeared ' + str(filler_count) + ' times — cutting this below 3 is the fastest clarity win.' if filler_count > 3 else 'Low filler word count — strong signal of composure.'}",
                f"{'Average answer length was ' + str(round(avg_words)) + ' words — target 30–45 for maximum clarity.' if avg_words > 45 or avg_words < 20 else 'Answer length is in the ideal 20–45 word range.'}",
            ],
            milestones=[
                f"Reduce filler words below 3 in your next session" if filler_count > 3 else "Keep filler words under control — you are close to the top",
                f"Back every claim with one specific example" if evidence_count < 3 else "Add a measurable outcome to at least one answer",
                f"Reach {min(100, metrics.reasoningQuality + 8)}+ on reasoning quality" if metrics.reasoningQuality < 85 else "Maintain reasoning quality above 85 for 3 sessions in a row",
            ],
            createdAt=utc_now_iso(),
        )
