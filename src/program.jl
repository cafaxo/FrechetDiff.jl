mutable struct Program
    nodes::Vector{Any}
    args::Vector{Vector{Int}}
    return_node::Int
    graph::DirectedGraph
end

struct ArgumentNode end

struct CallNode
    f::Any
    args::Vector{Any}
end

struct TupleNode
    args::Vector{Any}
end

struct ZeroNode
    node_id::Int
end

struct TrackedValue
    id::Int
    program::Program
end

Base.show(io::IO, tv::TrackedValue) = print(io, "TrackedValue($(tv.id))")

function add_call!(program::Program, f, args::Vector{Any})
    push!(program.nodes, CallNode(f, args))

    node_id = create_node!(program.graph)

    for arg in args
        if arg isa TrackedValue
            add_edge!(program.graph, arg.id => node_id)
        end
    end

    return TrackedValue(node_id, program)
end

function add_call!(f, args::Vector{Any})
    program = nothing

    for arg in args
        if arg isa TrackedValue
            program = arg.program
            break
        end
    end

    program::Program

    return add_call!(program, f, args)
end

function add_zero!(program::Program, node_id::Int)
    push!(program.nodes, ZeroNode(node_id))

    zero_node_id = create_node!(program.graph)
    add_edge!(program.graph, node_id => zero_node_id)

    # TODO: this feels a bit weird
    return TrackedValue(zero_node_id, program)
end

function add_tuple!(program::Program, args::Vector{Any})
    push!(program.nodes, TupleNode(args))

    node_id = create_node!(program.graph)

    for arg in args
        if arg isa TrackedValue
            add_edge!(program.graph, arg.id => node_id)
        end
    end

    return TrackedValue(node_id, program)
end

function record_function(@nospecialize(f), nargs::Int)
    program = Program(Any[], Vector{Int}[], 0, DirectedGraph())

    args = TrackedValue[]
    arg_ids = Int[]
    push!(program.args, arg_ids)

    for i in 1:nargs
        push!(args, TrackedValue(i, program))

        push!(program.nodes, ArgumentNode())
        node_id = create_node!(program.graph)
        push!(arg_ids, node_id)
    end

    return_value = f(args...)

    if return_value isa NTuple{N,TrackedValue} where N
        return_value = add_tuple!(program, Any[return_value...])
    end

    if !(return_value isa TrackedValue)
        error("unsupported return value") # TODO: better error message
    end

    program.return_node = return_value.id

    return program
end

function compact!(program)
    required_nodes = Set(reduce(vcat, program.args))
    union!(required_nodes, ancestors(program.graph, Set(program.return_node)))

    remove_nodes!(program.graph, setdiff(nodes(program.graph), required_nodes))

    return program
end

function create_subprograms(program::Program)
    subprograms = Vector{Int}[]

    compact!(program)

    executable_order = topological_sort(program.graph)

    unassigned_nodes = copy(nodes(program.graph))

    # TODO: this seems confusing
    for args in reverse(program.args)
        subprogram = copy(args)
        setdiff!(unassigned_nodes, subprogram)

        nodes = descendants(program.graph, Set(args))
        intersect!(nodes, unassigned_nodes)
        setdiff!(unassigned_nodes, nodes)

        append!(subprogram, intersect(executable_order, nodes))
        push!(subprograms, subprogram)
    end

    @assert isempty(unassigned_nodes)

    return reverse(subprograms)
end
