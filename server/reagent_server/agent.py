from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent


@tool
def web_search(query: str) -> str:
    """Search the web for current information about any topic."""
    try:
        from duckduckgo_search import DDGS
        results = list(DDGS().text(query, max_results=4))
        if not results:
            return f"No results found for: {query}"
        return "\n\n".join(
            f"[{r['title']}]\n{r['body']}"
            for r in results
        )
    except Exception as e:
        return f"Search failed: {e}"


def build_agent(model: str):
    llm = ChatAnthropic(model=model, max_tokens=1024)
    return create_react_agent(llm, [web_search])
