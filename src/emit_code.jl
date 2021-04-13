function emit_node(program::Program, symbol_map, call_node::CallNode)
    call_expr = Expr(:call, call_node.f)

    for arg in call_node.args
        if arg isa TrackedValue
            push!(call_expr.args, symbol_map[arg.id])
        else
            push!(call_expr.args, arg)
        end
    end

    return call_expr
end

function emit_node(program::Program, symbol_map, zero_node::ZeroNode)
    return :(zero($(symbol_map[zero_node.node_id])))
end

function emit_node(program::Program, symbol_map, tuple_node::TupleNode)
    tuple_expr = Expr(:tuple)

    for arg in tuple_node.args
        if arg isa TrackedValue
            push!(tuple_expr.args, symbol_map[arg.id])
        else
            push!(tuple_expr.args, arg)
        end
    end

    return tuple_expr
end

function emit_subprogram(program::Program, subprograms, symbol_map, i::Int)
    sp = subprograms[i]

    block = Expr(:block)

    for j in length(program.args[i])+1:length(sp)
        node = program.nodes[sp[j]]
        node_expr = emit_node(program, symbol_map, node)
        push!(block.args, Expr(:(=), symbol_map[sp[j]], node_expr))
    end

    if length(subprograms) > i
        push!(block.args, emit_subprogram(program, subprograms, symbol_map, i+1))
    else
        push!(block.args, Expr(:return, symbol_map[program.return_node]))
    end

    subprogram_args = program.args[i]

    args_expr = if length(subprogram_args) > 1
        args_tuple_expr = Expr(:tuple)

        for node_id in subprogram_args
            push!(args_tuple_expr.args, symbol_map[node_id])
        end

        args_tuple_expr
    elseif length(subprogram_args) == 1
        symbol_map[subprogram_args[1]]
    else
        error("we do not support subprograms with zero arguments")
    end

    return Expr(:->, args_expr, block)
end

function emit_code(program::Program)
    subprograms = create_subprograms(program)
    executable_order = reduce(vcat, subprograms)
    symbol_map = Dict{Int,Symbol}()

    for i in 1:length(executable_order)
        symbol_map[executable_order[i]] = Symbol("s", i)
    end

    return emit_subprogram(program, subprograms, symbol_map, 1)
end
