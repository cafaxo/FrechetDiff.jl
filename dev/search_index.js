var documenterSearchIndex = {"docs":
[{"location":"examples/#Examples","page":"Examples","title":"Examples","text":"","category":"section"},{"location":"examples/#Introduction","page":"Examples","title":"Introduction","text":"","category":"section"},{"location":"examples/","page":"Examples","title":"Examples","text":"The FrechetDiff package exports the following three methods:","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"record_function(f, i) records a function with i arguments into a Program object (a representation that FrechetDiff can differentiate)\ndifferentiate(program) differentiates a Program object with respect to the first argument of the recorded function\nemit_code(program) converts the Program back into Julia code","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"To show how FrechetDiff is used in practice, we start up a Julia REPL and define a simple function:","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"julia> using FrechetDiff\n\njulia> f(x) = x .* circshift(x, 1);","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"Next, we create a Program from this function:","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"julia> program = record_function(f, 1);\n\njulia> emit_code(program)\n:(s1->begin\n          s2 = (circshift)(s1, 1)\n          s3 = (Base.Broadcast.broadcasted)(*, s1, s2)\n          s4 = (Base.Broadcast.materialize)(s3)\n          return s4\n      end)","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"We differentiate with respect to x:","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"julia> program_diff = differentiate(program);\n\njulia> emit_code(program_diff)\n:(s1->begin\n          s2 = (circshift)(s1, 1)\n          s3->begin\n                  s4 = (circshift)(s3, 1)\n                  s5 = (Base.Broadcast.broadcasted)(*, s3, s2)\n                  s6 = (Base.Broadcast.materialize)(s5)\n                  s7 = (Base.Broadcast.broadcasted)(*, s1, s4)\n                  s8 = (Base.Broadcast.materialize)(s7)\n                  s9 = (+)(s6, s8)\n                  return s9\n              end\n      end)\n\njulia> f´ = eval(ans);","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"We can evaluate the derivative like this:","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"julia> f´(rand(6))(rand(6))\n6-element Vector{Float64}:\n 0.7517604536769744\n 0.5912242066991258\n 0.2877951425950339\n 0.17960873619331497\n 0.09882525939029835\n 0.25660723562975296","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"To compute the Jacobian matrix at a point, we evaluate the derivative on a set of basis vectors:","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"julia> using SparseArrays\n\njulia> hcat(f´(rand(6)).([sparsevec(Dict(i => 1.0), 6) for i in 1:6])...)\n6×6 SparseMatrixCSC{Float64, Int64} with 12 stored entries:\n 0.446568   ⋅         ⋅         ⋅         ⋅        0.865412\n 0.617492  0.865412   ⋅         ⋅         ⋅         ⋅ \n  ⋅        0.285698  0.617492   ⋅         ⋅         ⋅ \n  ⋅         ⋅        0.463847  0.285698   ⋅         ⋅ \n  ⋅         ⋅         ⋅        0.275819  0.463847   ⋅ \n  ⋅         ⋅         ⋅         ⋅        0.446568  0.275819","category":"page"},{"location":"examples/#Computing-a-Hessian","page":"Examples","title":"Computing a Hessian","text":"","category":"section"},{"location":"examples/","page":"Examples","title":"Examples","text":"FrechetDiff allows us to compute derivatives of any order. In this example, we want to represent the second-order derivative of","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"julia> f(x) = x[1] * sum(x .* circshift(x, 1));","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"as a Hessian matrix.","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"First, we compute the second-order derivative:","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"julia> program_diff1 = differentiate(program);\n\njulia> program_diff2 = differentiate(program);\n\njulia> f´´ = eval(emit_code(program_diff2));","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"For efficient computation of the Hessian, FrechetDiff offers an experimental materialize_hessian routine:","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"julia> materialize_hessian(f´´, rand(6))\n6×6 Matrix{Float64}:\n 1.54853   1.73611   0.912468  1.61939   0.534626  2.07346\n 1.73611   0.0       0.547546  0.0       0.0       0.0\n 0.912468  0.547546  0.0       0.547546  0.0       0.0\n 1.61939   0.0       0.547546  0.0       0.547546  0.0\n 0.534626  0.0       0.0       0.547546  0.0       0.547546\n 2.07346   0.0       0.0       0.0       0.547546  0.0\n\njulia> @btime materialize_hessian(f´´, rand(10^4));\n  1.068 s (6 allocations: 763.09 MiB)","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"This routine uses a non-allocating version of SparseVector for the basis elements (SSparseVector). We consider this routine experimental since the included SSparseVector type currently has very limited functionality. In this example, the materialization requires O(n^2) floating point operations.","category":"page"},{"location":"examples/#An-example-involving-ApproxFun","page":"Examples","title":"An example involving ApproxFun","text":"","category":"section"},{"location":"examples/","page":"Examples","title":"Examples","text":"Consider the nonlinear operator","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"    A colon L^2(01) to mathbbRquad A(f) = int_0^1 sin(f(t)) f(t) mathrmdt","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"We implement this operator using the ApproxFun package:","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"julia> using ApproxFun\n\njulia> A(f) = sum(sin.(f)*f');\n\njulia> A(Fun(sin, 0..1))\n0.33363325460711935","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"FrechetDiff allows us to compute the derivative of this operator as follows:","category":"page"},{"location":"examples/","page":"Examples","title":"Examples","text":"julia> program = record_function(A, 1);\n\njulia> A´ = eval(emit_code(differentiate(program)));\n\njulia> A´(Fun(sin, 0..1))(Fun(t -> t, 0..1))\n0.7456241416655578","category":"page"},{"location":"howitworks/#How-it-works","page":"How it works","title":"How it works","text":"","category":"section"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"In this section, we describe how FrechetDiff generates derivatives from Julia functions.","category":"page"},{"location":"howitworks/#Recording-the-computation-graph","page":"How it works","title":"Recording the computation graph","text":"","category":"section"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"When the user calls record_function, we call the supplied function using special objects of the type TrackedValue as arguments. These objects store a pointer to a computation graph (stored in an object of type Program). As functions involving TrackedValue objects are called, we add nodes to the graph accordingly.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"Nodes without incoming edges are arguments to the Julia function. Nodes with incoming edges are operations that compute a value from the incoming edges.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"In effect, we symbolically evaluate the supplied function and record a computation graph along the way.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"This approach is very simple to implement. However, it has some downsides: For example, we have to manually extend all function calls that we want to track with TrackedValue:","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"circshift(x::TrackedValue, i) = add_call!(circshift, Any[x, i])","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"In the future, we want to look into creating the computation graph from an intermediate representation of the Julia function using the IRTools package. This is the same method that the Zygote package employs for automatic differentiation.","category":"page"},{"location":"howitworks/#Differentiation","page":"How it works","title":"Differentiation","text":"","category":"section"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"When the user calls differentiate, the goal is to create a computation graph that represents the derivative with respect to the first argument of the originally recorded function. Denote the node in the graph that corresponds to this argument by x.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"First, we compute a list of nodes that depend on x (have x as an ancestor). Then, we topologically sort this list of nodes such that ancestors of any given node only occur before this node in the list. The first node in this list is x and the last node corresponds to the returned value of the program. Denote the length of this list as n.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"To explain how the derivative is computed, we imagine that all argument nodes other than x are bound to some constant value. This allows us to (mathematically) define functions f_i that map a value of x to the value that the i-th node in the previously sorted list would attain.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"The goal is to extend the computation graph to get a node that represents the value f_n(x)v. As the first step towards this goal, we add a new argument node that represents v. Next, nodes representing f_1(x)v f_2(x)v dots are successively added to the graph. This happens in the following way:","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"Assume that nodes for f_1(x)v dots f_i-1(x)v have already been added. The task is to create a node for f_i(x)v. Denote the computation that happens at the i-th node in the sorted list by g such that f_i(x) = g(f_j_1(x) dots f_j_m(x)). Note that thanks to the way we sorted our list, it holds that j_1 dots j_m  i.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"By chain rule, it holds that","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"    f_i(x) v = sum_k=1^m g_k(f_j_k(x)) f_j_k(x) v","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"Here, g_k denotes g where all except the k-th argument are set to f_j_1(x) f_j_2(x) dots. The evaluation of g_k is implemented via a fixed differentiation rule.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"The definition of such a differentiation rule looks as follows:","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"diff_rule(::typeof(*), ::Val{1}, x1, x2) = y -> y * x2","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"This describes the derivative of (x1, x2) -> x1*x2 with respect to the first argument.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"Since f_j_k(x) and f_j_k(x) v are already nodes within the computation graph, the application of the differentiation rule is symbolically recorded in a similar way that functions are recorded in the first stage. (With the help of TrackedValue objects.)","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"This recording process usually adds multiple nodes to the graph and then returns the node that represents the result of applied differentiation rules, which is f_i(x) h. This accomplishes the task of creating a node for f_i(x)v.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"At the end of all of this, a node for f_n(x)v is created which concludes the task of computing the derivative.","category":"page"},{"location":"howitworks/#Code-emission","page":"How it works","title":"Code emission","text":"","category":"section"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"When the user calls emit_code, we first eliminate dead nodes from the graph that are not required for the computation the returned node.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"Suppose that we have to emit code for a program that was differentiated n times. This means that the goal is to emit a Julia function fn such that fn(x)(v1)(v2)...(vn) corresponds to f^(n)(x)(v_1 dots v_n).","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"To do this, we start by considering the nodes in the graph that only depend on x and not v_1 dots v_n. We bring these nodes into an executable order (a topologically sorted order) and then emit this partial program into Expr objects.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"Then, we emit the first closure v1 -> begin ... end. Within this closure, we have available v_1 in addition to all previously computed nodes. Now we emit the partial program that depends only on x and v_1.","category":"page"},{"location":"howitworks/","page":"How it works","title":"How it works","text":"We repeat this process until the last closure vn -> begin ... end is emitted. This last closure returns the required value.","category":"page"},{"location":"limitations/#Limitations","page":"Limitations","title":"Limitations","text":"","category":"section"},{"location":"limitations/","page":"Limitations","title":"Limitations","text":"We want to make users aware of an issue that can arise from incorrect usage of eval(emit_code(program)).","category":"page"},{"location":"limitations/","page":"Limitations","title":"Limitations","text":"Consider the following code:","category":"page"},{"location":"limitations/","page":"Limitations","title":"Limitations","text":"function do_something(f´)\n    # do something with f´\nend\n\nfunction this_wont_work(program, x)\n    program_diff = differentiate(program)\n    f´ = eval(emit_code(program_diff))\n\n    do_something(f´) # this will throw a world-age error\nend","category":"page"},{"location":"limitations/","page":"Limitations","title":"Limitations","text":"The world-age error arises from the fact that the Julia function f´ is compiled during the evaluation of this_wont_work. This implies that f´ lives in different world than this_wont_work and thus cannot be directly used in this_wont_work. More on world-age can be learned in the paper World Age in Julia: Optimizing Method Dispatch in the Presence of Eval.","category":"page"},{"location":"limitations/","page":"Limitations","title":"Limitations","text":"The correct way to work around this issue is by using Base.invokelatest:","category":"page"},{"location":"limitations/","page":"Limitations","title":"Limitations","text":"function do_something(f´)\n    # do something with f´\nend\n\nfunction this_will_work(program, x)\n    program_diff = differentiate(program)\n    f´ = eval(emit_code(program_diff))\n\n    Base.invokelatest(do_something, f´) # this is works just fine\nend","category":"page"},{"location":"limitations/","page":"Limitations","title":"Limitations","text":"Note that this issue does not arise when using FrechetDiff interactively in the Julia REPL as we do in Examples.","category":"page"},{"location":"limitations/","page":"Limitations","title":"Limitations","text":"Why do other automatic differentiation tools not suffer from the same issue?","category":"page"},{"location":"limitations/","page":"Limitations","title":"Limitations","text":"Packages like Zygote also generate Julia code on-the-fly. However, Zygote uses @generated functions and thereby does not require the user to call eval in the first place.","category":"page"},{"location":"limitations/","page":"Limitations","title":"Limitations","text":"In the future, we will explore using @generated functions in FrechetDiff to work around this issue.","category":"page"},{"location":"#FrechetDiff.jl","page":"Introduction","title":"FrechetDiff.jl","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"FrechetDiff is an experimental Julia package for automatic differentiation (AD).","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Given a Julia function f, FrechetDiff automatically generates another Julia function f´. In contrast to other AD packages like ForwardDiff, f´(x) does not return the Jacobian matrix. Instead, f´(x) returns an anonymous Julia function (a closure) that computes the directional derivative f(x) v when evaluated at v.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"The idea behind FrechetDiff is to do most of the expensive computations when calling f´. Intermediate results are then passed to the closure that is returned from f´(x), making the evaluation of the directional derivatives as cheap as possible.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"An advantage of this approach is that it is oblivious to how the vectors are represented: Vectors are not required to be of type AbstractArray.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Higher-order derivatives are supported. The result of evaluating an n-th derivative f^(n) at a point x is a multilinear map. This multilinear map is represented via nested closures.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Go to Examples to learn how FrechetDiff is used.\nGo to How it works to learn what is going on behind the scenes.","category":"page"},{"location":"#Authors","page":"Introduction","title":"Authors","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Lukas Mayrhofer","category":"page"},{"location":"#Installation","page":"Introduction","title":"Installation","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"FrechetDiff is not a registered package yet. Currently, it can be installed by running","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"pkg> add https://github.com/cafaxo/FrechetDiff.jl","category":"page"}]
}
