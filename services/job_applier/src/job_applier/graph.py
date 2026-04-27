from langgraph.graph import END, START, StateGraph

from job_applier.nodes import ApplierNodes
from job_applier.state import ApplierState


def _has_unknowns(state: ApplierState) -> str:
    return "interrupt" if state.get("unknown_fields") else "submit"


def build_graph(nodes: ApplierNodes, checkpointer):
    builder = StateGraph(ApplierState)

    builder.add_node("navigate_and_auth", nodes.navigate_and_auth)
    builder.add_node("navigate_to_apply", nodes.navigate_to_apply)
    builder.add_node("fill_form", nodes.fill_form)
    builder.add_node("save_and_interrupt", nodes.save_and_interrupt)
    builder.add_node("apply_answers", nodes.apply_answers)
    builder.add_node("submit_application", nodes.submit_application)

    builder.add_edge(START, "navigate_and_auth")
    builder.add_edge("navigate_and_auth", "navigate_to_apply")
    builder.add_edge("navigate_to_apply", "fill_form")
    builder.add_conditional_edges("fill_form", _has_unknowns, {
        "interrupt": "save_and_interrupt",
        "submit": "submit_application",
    })
    builder.add_edge("save_and_interrupt", "apply_answers")
    builder.add_edge("apply_answers", "submit_application")
    builder.add_edge("submit_application", END)

    return builder.compile(checkpointer=checkpointer)
