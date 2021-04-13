using FrechetDiff
using Documenter

makedocs(
    modules = [FrechetDiff],
    sitename = "FrechetDiff.jl",
    pages = [
        "Introduction" => "index.md",
        "Examples" => "examples.md",
        "How it works" => "howitworks.md",
        "Limitations" => "limitations.md",
    ],
    format = Documenter.HTML(),
)

deploydocs(
    repo = "github.com/cafaxo/FrechetDiff.jl.git",
)
