module FrechetDiff

using LinearAlgebra
using ForwardDiff

include("graph.jl")
include("program.jl")
include("emit_code.jl")
include("differentiate.jl")
include("rules.jl")
include("materialize.jl")

export record_function, differentiate, emit_code, materialize_hessian

end # module
