# How it works

In this section, we describe how **FrechetDiff** generates derivatives from Julia functions.

## Recording the computation graph

When the user calls `record_function`, we call the supplied function using special objects of the type `TrackedValue` as arguments.
These objects store a pointer to a computation graph (stored in an object of type `Program`).
As functions involving `TrackedValue` objects are called, we add nodes to the graph accordingly.

Nodes without incoming edges are arguments to the Julia function.
Nodes with incoming edges are operations that compute a value from the incoming edges.

In effect, we symbolically evaluate the supplied function and record a computation graph along the way.

This approach is very simple to implement.
However, it has some downsides:
For example, we have to manually extend all function calls that we want to track with `TrackedValue`:
```julia
circshift(x::TrackedValue, i) = add_call!(circshift, Any[x, i])
```
In the future, we want to look into creating the computation graph from an intermediate representation of the Julia function using the [**IRTools**](https://github.com/FluxML/IRTools.jl) package.
This is the same method that the [**Zygote**](https://github.com/FluxML/Zygote.jl) package employs for automatic differentiation.

## Differentiation

When the user calls `differentiate`, the goal is to create a computation graph that represents the derivative with respect to the first argument of the originally recorded function.
Denote the node in the graph that corresponds to this argument by `x`.

First, we compute a list of nodes that depend on `x` (have `x` as an ancestor).
Then, we topologically sort this list of nodes such that ancestors of any given node only occur before this node in the list.
The first node in this list is `x` and the last node corresponds to the returned value of the program.
Denote the length of this list as `n`.

To explain how the derivative is computed, we imagine that all argument nodes other than `x` are bound to some constant value.
This allows us to (mathematically) define functions $f_i$ that map a value of $x$ to the value that the $i$-th node in the previously sorted list would attain.

The goal is to extend the computation graph to get a node that represents the value $f_n'(x)v$.
As the first step towards this goal, we add a new argument node that represents $v$.
Next, nodes representing $f_1'(x)v, f_2'(x)v, \dots$ are successively added to the graph.
This happens in the following way:

Assume that nodes for $f_1'(x)v, \dots, f_{i-1}'(x)v$ have already been added.
The task is to create a node for $f_i'(x)v$.
Denote the computation that happens at the $i$-th node in the sorted list by $g$ such that $f_i(x) = g(f_{j_1}(x), \dots, f_{j_m}(x))$.
Note that thanks to the way we sorted our list, it holds that $j_1, \dots, j_m < i$.

By the chain rule, it holds that
```math
    f_i'(x) v = \sum_{k=1}^m g_k'(f_{j_k}(x)) f_{j_k}'(x) v.
```
Here, $g_k$ denotes $g$ where all except the $k$-th argument are fixed to $f_{j_1}(x), f_{j_2}(x), \dots$.
The evaluation of $g_k'$ is implemented via a predefined differentiation rule.

Such a differentiation rule looks as follows:
```julia
diff_rule(::typeof(*), ::Val{1}, x1, x2) = y -> y * x2
```
This describes the derivative of `(x1, x2) -> x1*x2` with respect to the first argument.

Since $f_{j_k}(x)$ and $f_{j_k}'(x) v$ are already nodes within the computation graph, the application of the differentiation rule is symbolically recorded in the same way that functions are recorded with `record_function` (using `TrackedValue` objects).

This recording process usually adds multiple nodes to the graph and then returns the node that represents the result of the applied differentiation rules, which is $f_i'(x) v$.

At the end the iteration, a node for $f_n'(x)v$ is created which concludes the task of computing the derivative.

## Code emission

When the user calls `emit_code`, we first eliminate *dead* nodes from the graph.
These are nodes that are not required for the computation the returned node.

Suppose that we have to emit code for a program that was differentiated $n$ times.
This means that the goal is to create a Julia function `fn` such that `fn(x)(v1)(v2)...(vn)` corresponds to $f^{(n)}(x)(v_1, \dots, v_n)$.

To do this, we start by considering the nodes in the graph that only depend on $x$ and not on $v_1, \dots v_n$.
We bring these nodes into an *executable* order (a topologically sorted order) and then emit this partial program into `Expr` objects.

Then, we emit the first closure `v1 -> begin ... end`.
Within this closure, we have available $v_1$ in addition to all previously emitted nodes.
Now we emit the partial program that depends only on $x$ and $v_1$.

We repeat this process until the last closure `vn -> begin ... end` is emitted.
This last closure returns the required value.
