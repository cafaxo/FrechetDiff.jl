struct DirectedGraph
    nodes::Set{Int}
    incoming_edges::Vector{Set{Int}}
    outgoing_edges::Vector{Set{Int}}
end

DirectedGraph() = DirectedGraph(Set{Int}(), Set{Int}[], Set{Int}[])

nodes(graph::DirectedGraph) = graph.nodes

incoming_edges(graph::DirectedGraph, node::Int) = graph.incoming_edges[node]

outgoing_edges(graph::DirectedGraph, node::Int) = graph.outgoing_edges[node]

Base.copy(graph::DirectedGraph) = DirectedGraph(copy())

function create_node!(graph)
    push!(graph.incoming_edges, Set{Int}())
    push!(graph.outgoing_edges, Set{Int}())

    node = length(graph.incoming_edges)
    push!(graph.nodes, node)

    return node
end

function add_edge!(graph::DirectedGraph, edge::Pair{Int,Int})
    from, to = edge

    push!(graph.incoming_edges[to], from)
    push!(graph.outgoing_edges[from], to)

    return graph
end

function remove_edge!(graph::DirectedGraph, edge::Pair{Int,Int})
    from, to = edge

    delete!(graph.incoming_edges[to], from)
    delete!(graph.outgoing_edges[from], to)

    return graph
end

function remove_node!(graph::DirectedGraph, node::Int)
    for e in incoming_edges(graph, node)
        remove_edge!(graph, e => node)
    end

    for e in outgoing_edges(graph, node)
        remove_edge!(graph, node => e)
    end

    delete!(graph.nodes, node)

    return graph
end

function remove_nodes!(graph::DirectedGraph, nodes)
    for node in nodes
        remove_node!(graph, node)
    end

    return graph
end

# returns ancestors including the nodes themselves
function ancestors(graph::DirectedGraph, nodes::Set{Int})
    ancestors = copy(nodes)

    queue = Int[ancestors...]

    while !isempty(queue)
        node = pop!(queue)

        for ancestor in incoming_edges(graph, node)
            if !(ancestor in ancestors)
                push!(ancestors, ancestor)
                push!(queue, ancestor)
            end
        end
    end

    return ancestors
end

function descendants(graph::DirectedGraph, nodes::Set{Int})
    descendants = Set{Int}()

    queue = Int[nodes...]

    while !isempty(queue)
        node = pop!(queue)

        for descendant in outgoing_edges(graph, node)
            if !(descendant in descendants)
                push!(descendants, descendant)
                push!(queue, descendant)
            end
        end
    end

    return descendants
end

# https://en.wikipedia.org/wiki/Topological_sorting#Kahn's_algorithm
function topological_sort!(graph)
    # TODO: this is valid thanks to the way we currently manipulate the graph
    return sort(collect(nodes(graph)))

#=
    L = Int[]

    S = filter(node -> isempty(incoming_edges(graph, node)), nodes(graph))

    while !isempty(S)
        n = pop!(S)
        push!(L, n)

        for m in collect(outgoing_edges(graph, n))
            remove_edge!(graph, n => m)

            if isempty(incoming_edges(graph, m))
                push!(S, m)
            end
        end
    end

    #if !isempty(edges(graph))
    #    error("graph has at least one cycle")
    #end

    return L
=#
end

topological_sort(graph) = topological_sort!(deepcopy(graph))
