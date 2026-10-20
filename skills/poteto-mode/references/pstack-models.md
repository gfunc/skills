# pstack model configuration. One line per role. Edit freely; any plan may override per-role lines at authoring time.
# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit the subagent `model`). Alias entries in a panel list still count toward its fan-out.
# budget: large (xhigh)
feature, refactoring: magpie/bi-dev/kimi-code-cn/kimi-for-coding
bug-fix: magpie/bi-dev/kimi-code-cn/kimi-for-coding
hardest tasks: primary
judgment and prose: magpie/bi-dev/uco/qwen3.8-max-0902
swarm workers: magpie/bi-dev/group/auto-glm-5-3-flash
audit and second opinion: magpie/bi-dev/kimi-code-cn/k3-256k
