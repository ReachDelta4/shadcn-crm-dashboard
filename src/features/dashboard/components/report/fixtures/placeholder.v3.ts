import { REPORT_STRUCTURE_V3, type OutlineNode } from "../structure.v3";
import type { ReportDataV3 } from "../types.v3";

export function generatePlaceholderReportV3(): ReportDataV3 {
	const data: ReportDataV3 = {};
	function ensure(node: OutlineNode) {
		(node.children || []).forEach(ensure);
		switch (node.id) {
			case "tp_title": data.tp_title = data.tp_title || "Sales Call Report — CADD Centre AutoCAD Course Inquiry"; break;
			case "tp_subtitle": data.tp_subtitle = data.tp_subtitle || "Executive review of a 3‑minute inquiry call"; break;
			case "tp_deal": data.tp_deal = data.tp_deal || "AutoCAD Course Enrollment"; break;
			case "tp_sessionId": data.tp_sessionId = data.tp_sessionId || "CADD-2024-09-20-001"; break;

			case "p1_exec_headline": data.p1_exec_headline = data.p1_exec_headline || "Unqualified lead due to zero discovery; passive prospect engagement with no buying signals."; break;
			case "p1_exec_synopsis": data.p1_exec_synopsis = data.p1_exec_synopsis || "Rep delivered generic product details without understanding needs; trust not built; no objections handled. Next: re‑engage with targeted discovery questions to qualify."; break;
			case "p1_meta_full": data.p1_meta_full = data.p1_meta_full || { date: "2024-09-20", time: "10:00 AM", duration: "3 min", rep: { name: "Vignesh", role: "Sales Rep", team: "CADD Centre" }, prospect: { name: "Anonymous 'Sir'" }, channel: "phone", transcriptQuality: "Low confidence (repetitive phrasing, minimal engagement)" }; break;
			case "p1_key_points": data.p1_key_points = data.p1_key_points || ["Course duration (40/80 hrs)", "Pricing range (₹16k–₹28k)", "Onam festival discount (10–20%)", "Placement assistance claims", "Class timings (10 AM–5 PM)"]; break;
			case "p1_pains": data.p1_pains = data.p1_pains || ["Unclear need for AutoCAD skills (unconfirmed)", "Potential job placement urgency (assumed)", "Budget sensitivity (discounts pushed without context)"]; break;
			case "p1_buying_signals": data.p1_buying_signals = data.p1_buying_signals || ["None — only acknowledgments (\"Okay\", \"Yes sir\")"]; break;
			case "p1_objections_handled": data.p1_objections_handled = data.p1_objections_handled || [ { label: "Passive engagement (silence)", handled: "no" }, { label: "Discounts without budget confirmation", handled: "no" }, { label: "No authority confirmation", handled: "no" } ]; break;
			case "p1_action_items": data.p1_action_items = data.p1_action_items || [ { id: "a1", title: "Re‑engage with discovery‑focused call", owner: "Vignesh", due: "24h", priority: "High" }, { id: "a2", title: "Share placement success stories with specific metrics", owner: "Vignesh", due: "24h", priority: "High" }, { id: "a3", title: "Confirm prospect’s job role & decision authority", owner: "Vignesh", due: "24h", priority: "High" } ]; break;
			case "p1_deal_health": data.p1_deal_health = data.p1_deal_health || { score: 30, rationale: "Zero discovery; no buying signals; passive prospect; unqualified lead." }; break;

			case "p2_context_snapshot": data.p2_context_snapshot = data.p2_context_snapshot || "Call failed to qualify lead; discovery absent; generic pitch; prospect silent."; break;
			case "p2_high_priority": data.p2_high_priority = data.p2_high_priority || ["No discovery questions asked — rep dominated conversation", "Critical trust gap — no credibility elements", "Unspoken objections unaddressed — discounts applied prematurely"]; break;
			case "p2_medium_priority": data.p2_medium_priority = data.p2_medium_priority || ["Overemphasis on discounts without context", "No success stories shared", "Passive prospect engagement — 90% one-word replies"]; break;
			case "p2_info_items": data.p2_info_items = data.p2_info_items || ["Course duration: 40/80 hours", "Pricing: ₹16k–₹28k (10–20% discount)", "Class timing: 10 AM–5 PM", "Placement assistance mentioned but not contextualized"]; break;
			case "p2_risks_concerns": data.p2_risks_concerns = data.p2_risks_concerns || [ { area: "Prospect not decision‑maker", impact: "High", likelihood: "Medium", rationale: "No authority confirmation" }, { area: "Unverified need for AutoCAD", impact: "High", likelihood: "High", rationale: "No discovery asked" }, { area: "Budget misalignment", impact: "Medium", likelihood: "High", rationale: "Discounts pushed without budget" } ]; break;
			case "p2_short_summary": data.p2_short_summary = data.p2_short_summary || "Immediately book a discovery‑focused call and tailor next steps to confirmed goals."; break;

			case "p3_deal_health_summary": data.p3_deal_health_summary = data.p3_deal_health_summary || { score: 30, status: "At Risk (Unqualified Lead)" }; break;
			case "p3_meddicc": data.p3_meddicc = data.p3_meddicc || { metrics: { value: ["Not discussed (no measurable outcomes)"] }, economicBuyer: { value: "Unknown" }, decisionCriteria: { value: ["Not discussed"] }, decisionProcess: { value: "Unknown" }, identifyPain: { value: "Not confirmed" }, competition: { value: ["Not addressed"] }, champion: { value: "None identified" } }; break;
			case "p3_bant": data.p3_bant = data.p3_bant || { rows: [ { key: "Budget", status: "Gap", notes: "Discounts pushed without budget" }, { key: "Authority", status: "Unknown", notes: "Role unverified" }, { key: "Need", status: "Low", notes: "No pain points expressed" }, { key: "Timing", status: "TBD", notes: "No urgency discussed" } ] }; break;
			case "p3_missed_opportunities": data.p3_missed_opportunities = data.p3_missed_opportunities || ["No discovery phase", "Zero trust‑building", "Discounts offered before understanding price concern"]; break;
			case "p3_improvements": data.p3_improvements = data.p3_improvements || ["Active listening & open‑ended questioning", "Tailored solutioning — never pitch before discovery"]; break;
			case "p3_short_reco": data.p3_short_reco = data.p3_short_reco || "Schedule a 10‑minute discovery call to align course with goals before details."; break;

			case "p4_stage_eval": data.p4_stage_eval = data.p4_stage_eval || [
				{ stage: "Greetings", handled: "yes", note: "Informal 'Yeah'", score: 4 },
				{ stage: "Introduction", handled: "yes", note: "No permission", score: 3 },
				{ stage: "Customer Success Stories", handled: "no", note: "Zero examples", score: 0 },
				{ stage: "Discovery", handled: "no", note: "No questions", score: 1 },
				{ stage: "Product Details", handled: "yes", note: "Generic dump", score: 2 },
				{ stage: "Trust Building", handled: "no", note: "No proof", score: 0 },
				{ stage: "Objection Handling", handled: "no", note: "Unspoken objections", score: 2 },
				{ stage: "Buying‑Signal Capitalization", handled: "no", note: "Zero signals", score: 1 },
				{ stage: "Negotiation", handled: "no", note: "None", score: 1 },
				{ stage: "Timeline", handled: "yes", note: "Mentioned; not confirmed", score: 1 },
				{ stage: "Closing / Registration", handled: "no", note: "No next steps", score: 0 },
			]; break;

			case "p4_pivotal_points": data.p4_pivotal_points = data.p4_pivotal_points || [ { ts: "0:45", reason: "Shifted to pricing before discovery; engagement dropped", quote: "It will approximately be in that price range..." } ]; break;
			case "p4_takeaway": data.p4_takeaway = data.p4_takeaway || "Master discovery before pitching; never share details until goals, pains, and criteria are uncovered."; break;

			case "p5_stage_a": data.p5_stage_a = data.p5_stage_a || [ { stageName: "Greetings", objective: "Establish rapport; confirm identity; seek permission", indicators: ["Tone", "Identity confirmation", "Permission language"], observed: ["Informal 'Yeah'; no identity confirmation; no permission"], score: 40, weight: 10, mistakes: ["Informal greeting", "No identity confirmation", "No permission"], whatToSay: ["Good morning... May I confirm your name? May I take 2 minutes?"], positives: ["Introduced self/company"], coaching: ["Practice greeting script", "Reduce filler words", "Role‑play permission"], quickFix: "May I confirm your name before we proceed?" } ]; break;
			case "p5_stage_b": data.p5_stage_b = data.p5_stage_b || [ { stageName: "Introduction", objective: "Clarify purpose; confirm relevance; transition to discovery", indicators: ["Clarity of purpose", "Role confirmation", "Engagement"], observed: ["Reason stated; role not confirmed; no permission"], score: 30, weight: 10, mistakes: ["Assumed right contact", "Vague phrasing", "No transition to discovery"], whatToSay: ["Could you confirm your name and role?"], positives: ["Context mentioned (AutoCAD course)",], coaching: ["Confirm role before needs", "3 discovery questions before pitch"], quickFix: "Could you confirm your name and role?" } ]; break;
			case "p6_stage_c": data.p6_stage_c = data.p6_stage_c || [ { stageName: "Customer Success Stories", objective: "Build credibility", indicators: ["Specificity", "Relevance", "Reaction"], observed: ["None shared; generic claims"], score: 0, weight: 15, mistakes: ["No evidence", "No tie to goals"], whatToSay: ["Last month a student from [Industry]..."], positives: [], coaching: ["Prepare 3 specific stories"], quickFix: "Share 1 data‑backed example" } ]; break;
			case "p6_stage_d": data.p6_stage_d = data.p6_stage_d || [ { stageName: "Discovery", objective: "Uncover goals/pains/criteria", indicators: ["Question count", "Talk ratio"], observed: ["Rep spoke 95%", "Zero discovery"], score: 10, weight: 25, mistakes: ["No role/goals questions", "Feature dump"], whatToSay: ["What outcomes are you hoping to achieve?"], positives: [], coaching: ["3‑question discovery rule", "Silent pause after Q"], quickFix: "What’s your biggest goal for AutoCAD training?" } ]; break;
			case "p7_stage_e": data.p7_stage_e = data.p7_stage_e || [ { stageName: "Product Details", objective: "Tailor features to confirmed needs", indicators: ["Feature‑to‑goal linkage"], observed: ["Generic dump"], score: 20, weight: 15, mistakes: ["No tailoring", "No evidence"], whatToSay: ["Since you’re focused on placement..."], positives: ["Shared duration/price"], coaching: ["Benefits not specs", "If‑then framing"], quickFix: "Based on your goal... would that help?" } ]; break;
			case "p7_stage_f": data.p7_stage_f = data.p7_stage_f || [ { stageName: "Trust Building", objective: "Establish credibility", indicators: ["Proof shared"], observed: ["None"], score: 0, weight: 15, mistakes: ["No data", "No examples"], whatToSay: ["92% get placed within 3 months..."], positives: [], coaching: ["3 credibility statements", "Cite sources"], quickFix: "Would that help your career?" } ]; break;
			case "p8_stage_g": data.p8_stage_g = data.p8_stage_g || [ { stageName: "Objection Handling", objective: "Address unspoken objections", indicators: ["Resolution technique"], observed: ["None"], score: 15, weight: 10, mistakes: ["Assumed no objections", "Discounts prematurely"], whatToSay: ["Some prospects ask about the investment — would you like to know ROI?"], positives: ["Discount mentioned (premature)"], coaching: ["Anticipate top 3 objections"], quickFix: "What’s your biggest worry about this course?" } ]; break;
			case "p8_stage_h": data.p8_stage_h = data.p8_stage_h || [ { stageName: "Buying Signals", objective: "Capitalize on signals", indicators: ["Next steps offered"], observed: ["No signals detected"], score: 5, weight: 10, mistakes: ["No confirmation closing"], whatToSay: ["Would you like a quick demo?"], positives: [], coaching: ["Silence handling"], quickFix: "Is there something holding you back?" } ]; break;
			case "p9_stage_i": data.p9_stage_i = data.p9_stage_i || [ { stageName: "Negotiation", objective: "Preserve value", indicators: ["Value first"], observed: ["Discounted prematurely"], score: 10, weight: 5, mistakes: ["No anchoring", "No packages"], whatToSay: ["Our 80‑hour course includes... ROI 4x"], positives: ["Discount mentioned"], coaching: ["Value‑first scripts"], quickFix: "Would you like to see a package fit?" } ]; break;
			case "p9_stage_j": data.p9_stage_j = data.p9_stage_j || [ { stageName: "Timeline", objective: "Confirm urgency & next steps", indicators: ["Next steps proposed"], observed: ["No next steps"], score: 0, weight: 5, mistakes: ["Passive closing"], whatToSay: ["Shall we schedule your start date?"], positives: [], coaching: ["Either/or closing"], quickFix: "Start Monday or Wednesday?" } ]; break;
			case "p10_stage_k": data.p10_stage_k = data.p10_stage_k || [ { stageName: "Registration / Closing", objective: "Secure commitment", indicators: ["Commitment confirmed"], observed: ["No closing attempt"], score: 0, weight: 5, mistakes: ["No direct ask"], whatToSay: ["I’d love to get you started! We accept UPI or card"], positives: [], coaching: ["Direct ask closing"], quickFix: "Enroll today and begin next Monday?" } ]; break;
			case "p10_stage_l": data.p10_stage_l = data.p10_stage_l || [ { stageName: "Post‑Close Handoff", objective: "Smooth onboarding", indicators: ["Handoff clarity"], observed: ["No handoff"], score: 0, weight: 5, mistakes: ["No handoff details"], whatToSay: ["I’ll email confirmation in 2 minutes; onboarding will call tomorrow"], positives: [], coaching: ["Handoff script"], quickFix: "We’ll call tomorrow to schedule your first session" } ]; break;


			case "apx_scoring_rubric": data.apx_scoring_rubric = data.apx_scoring_rubric || [
				"0–30%: Critical failures (no discovery/closing)",
				"31–60%: Partial execution",
				"61–80%: Good execution",
				"81–100%: Enterprise‑grade",
				"Weights: Discovery 25%, Trust 15%, Greetings 10%, Introduction 10%, Product 15%, Objections 10%, Closing 5%, Timeline 5%, Handoff 5%",
			]; break;

			case "apx_data_flags": data.apx_data_flags = data.apx_data_flags || ["Low‑Confidence Transcript", "Prospect‑Only Audio", "Unverified Identity"]; break;

		}
	}
	REPORT_STRUCTURE_V3.forEach(ensure);
	return data;
}
