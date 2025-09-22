/**
 * Universal Scoring Rubric System
 * 
 * This is the single source of truth for call quality scoring across all reports.
 * Changes to this rubric should be versioned and backward compatible.
 */

export interface RubricCriterion {
  id: string
  name: string
  description: string
  weight: number
  scale: {
    min: number
    max: number
    labels: Record<number, string>
  }
  evidence_required: boolean
}

export interface UniversalRubric {
  version: string
  name: string
  description: string
  total_possible: number
  criteria: RubricCriterion[]
  created_at: string
  deprecated?: boolean
}

export interface RubricScore {
  criterion_id: string
  raw_score: number
  weighted_score: number
  evidence?: string
  confidence: number
}

export interface ComputedRubricResult {
  rubric_version: string
  total_score: number
  percentage: number
  grade: string
  criteria_scores: RubricScore[]
  computed_at: string
}

/**
 * Current Universal Rubric Definition (v1.0)
 * 
 * This rubric evaluates call quality across 8 key dimensions.
 * Each criterion is weighted based on business impact.
 */
export const UNIVERSAL_RUBRIC_V1: UniversalRubric = {
  version: "1.0",
  name: "Universal Call Quality Rubric",
  description: "Comprehensive evaluation framework for sales call effectiveness and customer engagement quality",
  total_possible: 100,
  created_at: "2024-09-21T00:00:00Z",
  criteria: [
    {
      id: "discovery_depth",
      name: "Discovery & Needs Analysis",
      description: "Depth and quality of needs discovery, pain identification, and requirement gathering",
      weight: 0.20,
      scale: {
        min: 0,
        max: 10,
        labels: {
          0: "No discovery attempted",
          3: "Surface-level questions only",
          5: "Basic needs identified",
          7: "Good discovery with pain points",
          9: "Deep discovery with business impact",
          10: "Exceptional discovery with quantified impact"
        }
      },
      evidence_required: true
    },
    {
      id: "stakeholder_mapping",
      name: "Stakeholder Identification",
      description: "Quality of stakeholder mapping, decision-maker identification, and influence understanding",
      weight: 0.15,
      scale: {
        min: 0,
        max: 10,
        labels: {
          0: "No stakeholder discussion",
          3: "Basic contact identification",
          5: "Key stakeholders identified",
          7: "Decision makers and influencers mapped",
          9: "Complete stakeholder ecosystem understood",
          10: "Stakeholder motivations and dynamics clear"
        }
      },
      evidence_required: true
    },
    {
      id: "value_articulation",
      name: "Value Proposition & ROI",
      description: "Clarity and relevance of value proposition, ROI demonstration, and business case development",
      weight: 0.18,
      scale: {
        min: 0,
        max: 10,
        labels: {
          0: "No value discussed",
          3: "Generic value statements",
          5: "Some relevant benefits mentioned",
          7: "Clear value proposition with examples",
          9: "Quantified ROI with customer context",
          10: "Compelling business case with measurable outcomes"
        }
      },
      evidence_required: true
    },
    {
      id: "objection_handling",
      name: "Objection Management",
      description: "Effectiveness in identifying, addressing, and resolving customer concerns and objections",
      weight: 0.12,
      scale: {
        min: 0,
        max: 10,
        labels: {
          0: "Objections ignored or poorly handled",
          3: "Basic acknowledgment of concerns",
          5: "Adequate responses to objections",
          7: "Good objection handling with evidence",
          9: "Excellent objection resolution with proof",
          10: "Turns objections into selling opportunities"
        }
      },
      evidence_required: false
    },
    {
      id: "qualification_rigor",
      name: "Qualification Process",
      description: "Thoroughness of BANT/MEDDICC qualification and opportunity assessment",
      weight: 0.15,
      scale: {
        min: 0,
        max: 10,
        labels: {
          0: "No qualification attempted",
          3: "Basic qualification questions",
          5: "Standard BANT coverage",
          7: "Thorough BANT with validation",
          9: "Complete MEDDICC qualification",
          10: "Advanced qualification with risk assessment"
        }
      },
      evidence_required: true
    },
    {
      id: "engagement_quality",
      name: "Customer Engagement",
      description: "Level of customer participation, interest, and collaborative dialogue quality",
      weight: 0.10,
      scale: {
        min: 0,
        max: 10,
        labels: {
          0: "Customer disengaged or resistant",
          3: "Minimal customer participation",
          5: "Adequate customer interaction",
          7: "Good customer engagement and dialogue",
          9: "High customer interest and collaboration",
          10: "Exceptional rapport and partnership dynamic"
        }
      },
      evidence_required: false
    },
    {
      id: "next_steps_clarity",
      name: "Next Steps & Commitment",
      description: "Clarity of next steps, mutual commitments, and forward momentum establishment",
      weight: 0.08,
      scale: {
        min: 0,
        max: 10,
        labels: {
          0: "No clear next steps",
          3: "Vague follow-up mentioned",
          5: "Basic next steps outlined",
          7: "Clear action items with timelines",
          9: "Mutual commitments with accountability",
          10: "Detailed action plan with milestones"
        }
      },
      evidence_required: true
    },
    {
      id: "competitive_positioning",
      name: "Competitive Differentiation",
      description: "Effectiveness in positioning against competitors and highlighting unique advantages",
      weight: 0.02,
      scale: {
        min: 0,
        max: 10,
        labels: {
          0: "No competitive discussion",
          3: "Basic feature comparison",
          5: "Some differentiation mentioned",
          7: "Clear competitive advantages",
          9: "Strong differentiation with proof points",
          10: "Exceptional competitive positioning strategy"
        }
      },
      evidence_required: false
    }
  ]
}

/**
 * Validate and compute rubric scores with defensive programming
 */
export function computeRubricScore(
  scores: Partial<Record<string, number>>,
  evidence?: Partial<Record<string, string>>,
  rubric: UniversalRubric = UNIVERSAL_RUBRIC_V1
): ComputedRubricResult {
  const criteriaScores: RubricScore[] = []
  let totalWeightedScore = 0
  let totalPossibleWeighted = 0

  for (const criterion of rubric.criteria) {
    const rawScore = scores[criterion.id] ?? 0
    
    // Defensive: clamp scores to valid range
    const clampedScore = Math.max(
      criterion.scale.min,
      Math.min(criterion.scale.max, rawScore)
    )
    
    const weightedScore = clampedScore * criterion.weight
    const confidence = rawScore === scores[criterion.id] ? 1.0 : 0.8 // Lower confidence for clamped scores
    
    criteriaScores.push({
      criterion_id: criterion.id,
      raw_score: clampedScore,
      weighted_score: weightedScore,
      evidence: evidence?.[criterion.id],
      confidence
    })
    
    totalWeightedScore += weightedScore
    totalPossibleWeighted += criterion.scale.max * criterion.weight
  }

  // Convert to percentage and assign grade
  const percentage = Math.round((totalWeightedScore / totalPossibleWeighted) * 100)
  const grade = getGradeFromPercentage(percentage)

  return {
    rubric_version: rubric.version,
    total_score: Math.round(totalWeightedScore * 100) / 100, // Round to 2 decimals
    percentage,
    grade,
    criteria_scores: criteriaScores,
    computed_at: new Date().toISOString()
  }
}

/**
 * Convert percentage to letter grade
 */
function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

/**
 * Get rubric by version with fallback to current
 */
export function getRubricByVersion(version?: string): UniversalRubric {
  // For now, only v1.0 exists. Future versions would be added here.
  switch (version) {
    case "1.0":
    default:
      return UNIVERSAL_RUBRIC_V1
  }
}

/**
 * Validate raw scores against rubric constraints
 */
export function validateRubricScores(
  scores: Record<string, number>,
  rubric: UniversalRubric = UNIVERSAL_RUBRIC_V1
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const criterion of rubric.criteria) {
    const score = scores[criterion.id]
    
    if (score === undefined) {
      errors.push(`Missing score for criterion: ${criterion.id}`)
      continue
    }
    
    if (typeof score !== 'number' || isNaN(score)) {
      errors.push(`Invalid score type for ${criterion.id}: must be number`)
      continue
    }
    
    if (score < criterion.scale.min || score > criterion.scale.max) {
      errors.push(`Score out of range for ${criterion.id}: ${score} (valid: ${criterion.scale.min}-${criterion.scale.max})`)
    }
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Generate LLM prompt instructions for rubric scoring
 */
export function generateRubricPromptInstructions(rubric: UniversalRubric = UNIVERSAL_RUBRIC_V1): string {
  const criteriaInstructions = rubric.criteria.map(criterion => {
    const scaleLabels = Object.entries(criterion.scale.labels)
      .map(([score, label]) => `${score}: ${label}`)
      .join('\n  ')
    
    return `${criterion.id} (Weight: ${criterion.weight * 100}%):
${criterion.description}
Scale ${criterion.scale.min}-${criterion.scale.max}:
  ${scaleLabels}
Evidence required: ${criterion.evidence_required ? 'YES - provide specific quote/example' : 'NO'}`
  }).join('\n\n')

  return `UNIVERSAL CALL QUALITY SCORING (v${rubric.version}):
Score each criterion based on call content. Provide evidence for required criteria.

${criteriaInstructions}

OUTPUT FORMAT:
{
  "rubric_scores": {
    ${rubric.criteria.map(c => `"${c.id}": <score 0-10>`).join(',\n    ')}
  },
  "rubric_evidence": {
    ${rubric.criteria.filter(c => c.evidence_required).map(c => `"${c.id}": "<specific quote or example>"`).join(',\n    ')}
  }
}`
}

/**
 * Extract rubric data from LLM response with validation
 */
export function extractAndValidateRubricFromResponse(
  response: any,
  rubric: UniversalRubric = UNIVERSAL_RUBRIC_V1
): { scores: Record<string, number>; evidence: Record<string, string>; warnings: string[] } {
  const warnings: string[] = []
  const scores: Record<string, number> = {}
  const evidence: Record<string, string> = {}
  
  // Extract scores with defensive parsing
  const rubricScores = response?.rubric_scores || {}
  for (const criterion of rubric.criteria) {
    const rawScore = rubricScores[criterion.id]
    if (typeof rawScore === 'number' && !isNaN(rawScore)) {
      scores[criterion.id] = Math.max(
        criterion.scale.min,
        Math.min(criterion.scale.max, rawScore)
      )
      if (scores[criterion.id] !== rawScore) {
        warnings.push(`Clamped ${criterion.id} score from ${rawScore} to ${scores[criterion.id]}`)
      }
    } else {
      // Fallback to middle score if missing/invalid
      scores[criterion.id] = Math.floor((criterion.scale.min + criterion.scale.max) / 2)
      warnings.push(`Missing/invalid score for ${criterion.id}, using fallback: ${scores[criterion.id]}`)
    }
  }
  
  // Extract evidence with validation
  const rubricEvidence = response?.rubric_evidence || {}
  for (const criterion of rubric.criteria) {
    if (criterion.evidence_required) {
      const evidenceText = rubricEvidence[criterion.id]
      if (typeof evidenceText === 'string' && evidenceText.trim().length > 0) {
        evidence[criterion.id] = evidenceText.trim()
      } else {
        evidence[criterion.id] = "Evidence not provided in AI response"
        warnings.push(`Missing evidence for ${criterion.id}`)
      }
    }
  }
  
  return { scores, evidence, warnings }
}
