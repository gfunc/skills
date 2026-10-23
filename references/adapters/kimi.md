harness=kimi
profile-root=plugin
profile=references/harnesses/kimi.md
Read the named profile before harness-dependent work.

`profile-root=plugin` means the installed plugin root: the directory containing
`kimi.plugin.json`. A skill's own directory at
`<plugin-root>/skills/<name>/` is two levels below it. A custom agent template
must retain the host's plugin-sections (or base-prompt) template variable, or
receive this line explicitly.
