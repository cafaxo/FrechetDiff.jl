function differentiate_node!(program::Program, derived_values::Dict{Int,Int}, call_node::CallNode)
    args = call_node.args

    derived_value = nothing

    for arg_i in 1:length(args)
        arg = args[arg_i]

        if !(arg isa TrackedValue)
            continue
        end

        arg::TrackedValue

        if !haskey(derived_values, arg.id)
            continue
        end

        arg_derived = derived_values[arg.id]

        f_der_lin = diff_rule(call_node.f, Val(arg_i), args...)

        # TODO: handle case that not TrackedValue
        return_value = f_der_lin(TrackedValue(arg_derived, program))::TrackedValue

        if derived_value === nothing
            derived_value = return_value
        else
            derived_value = derived_value::TrackedValue + return_value
        end
    end

    derived_value::TrackedValue
    return derived_value.id
end

function differentiate_node!(program::Program, derived_values::Dict{Int,Int}, tuple_node::TupleNode)
    args = tuple_node.args

    derived_args = Any[]

    for arg in tuple_node.args
        if !(arg isa TrackedValue)
            push!(derived_args, zero(arg))
            continue
        end

        arg::TrackedValue

        if !haskey(derived_values, arg.id)
            push!(derived_args, add_zero!(program, arg.id))
            continue
        end

        push!(derived_args, TrackedValue(derived_values[arg.id], program))
    end

    derived_value = add_tuple!(program, derived_args)
    return derived_value.id
end

function differentiate!(program::Program)
    # TODO: remember when program is in a compact state?
    compact!(program)

    executable_order = topological_sort(program.graph)

    # we only consider the nodes that depend on x
    intersect!(executable_order, descendants(program.graph, Set(program.args[1][1])))

    push!(program.nodes, ArgumentNode())
    y_node_id = create_node!(program.graph)

    y_value = TrackedValue(y_node_id, program)

    push!(program.args, Int[y_node_id])

    # denote by x the first argument
    # denote by y the argument to the linearized map
    # denote by f_i the map x -> si. then derived_values[i] represents f_i'(x)[y]
    derived_values = Dict{Int,Int}()
    derived_values[program.args[1][1]] = y_node_id

    for node_id in executable_order
        node = program.nodes[node_id]
        derived_values[node_id] = differentiate_node!(program, derived_values, node)
    end

    if !haskey(derived_values, program.return_node)
        # return node does not depend on x
        derived_values[program.return_node] = add_zero!(program, program.return_node).id
    end
    
    program.return_node = derived_values[program.return_node]

    compact!(program)

    return program
end

differentiate(program::Program) = differentiate!(deepcopy(program))
