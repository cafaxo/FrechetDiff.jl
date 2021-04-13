# Examples

## Introduction

The **FrechetDiff** package exports the following three methods:

* `record_function(f, i)` records a function with `i` arguments into a `Program` object (a representation that **FrechetDiff** can differentiate)

* `differentiate(program)` differentiates a `Program` object with respect to the first argument of the recorded function

* `emit_code(program)` converts the `Program` back into Julia code

To show how **FrechetDiff** is used in practice, we start up a Julia REPL and define a simple function:

```julia-repl
julia> using FrechetDiff

julia> f(x) = x .* circshift(x, 1);
```

Next, we create a `Program` from this function:


```julia-repl
julia> program = record_function(f, 1);

julia> emit_code(program)
:(s1->begin
          s2 = (circshift)(s1, 1)
          s3 = (Base.Broadcast.broadcasted)(*, s1, s2)
          s4 = (Base.Broadcast.materialize)(s3)
          return s4
      end)
```

We differentiate with respect to `x`:

```julia-repl
julia> program_diff = differentiate(program);

julia> emit_code(program_diff)
:(s1->begin
          s2 = (circshift)(s1, 1)
          s3->begin
                  s4 = (circshift)(s3, 1)
                  s5 = (Base.Broadcast.broadcasted)(*, s3, s2)
                  s6 = (Base.Broadcast.materialize)(s5)
                  s7 = (Base.Broadcast.broadcasted)(*, s1, s4)
                  s8 = (Base.Broadcast.materialize)(s7)
                  s9 = (+)(s6, s8)
                  return s9
              end
      end)

julia> f´ = eval(ans);
```

We can evaluate the derivative like this:

```julia-repl
julia> f´(rand(6))(rand(6))
6-element Vector{Float64}:
 0.7517604536769744
 0.5912242066991258
 0.2877951425950339
 0.17960873619331497
 0.09882525939029835
 0.25660723562975296
```

To compute the Jacobian matrix at a point, we evaluate the derivative on a set of basis vectors:

```julia-repl
julia> using SparseArrays

julia> hcat(f´(rand(6)).([sparsevec(Dict(i => 1.0), 6) for i in 1:6])...)
6×6 SparseMatrixCSC{Float64, Int64} with 12 stored entries:
 0.446568   ⋅         ⋅         ⋅         ⋅        0.865412
 0.617492  0.865412   ⋅         ⋅         ⋅         ⋅ 
  ⋅        0.285698  0.617492   ⋅         ⋅         ⋅ 
  ⋅         ⋅        0.463847  0.285698   ⋅         ⋅ 
  ⋅         ⋅         ⋅        0.275819  0.463847   ⋅ 
  ⋅         ⋅         ⋅         ⋅        0.446568  0.275819
```

## Computing a Hessian

**FrechetDiff** allows us to compute derivatives of any order.
In this example, we want to represent the second-order derivative of

```julia-repl
julia> f(x) = x[1] * sum(x .* circshift(x, 1));
```
as a Hessian matrix.

First, we compute the second-order derivative:

```julia-repl
julia> differentiate!(program);

julia> differentiate!(program);

julia> f´´ = eval(emit_code(program));
```

For efficient computation of the Hessian, **FrechetDiff** offers an experimental `materialize_hessian` routine:

```julia-repl
julia> materialize_hessian(f´´, rand(6))
6×6 Matrix{Float64}:
 1.54853   1.73611   0.912468  1.61939   0.534626  2.07346
 1.73611   0.0       0.547546  0.0       0.0       0.0
 0.912468  0.547546  0.0       0.547546  0.0       0.0
 1.61939   0.0       0.547546  0.0       0.547546  0.0
 0.534626  0.0       0.0       0.547546  0.0       0.547546
 2.07346   0.0       0.0       0.0       0.547546  0.0

julia> @btime materialize_hessian(f´´, rand(10^4));
  1.068 s (6 allocations: 763.09 MiB)
```

This routine uses a non-allocating version of `SparseVector` for the basis elements (`SSparseVector`).
We consider this routine experimental since the included `SSparseVector` type currently has very limited functionality.
In this example, the materialization requires `O(n^2)` floating point operations.

## An example involving `ApproxFun`

Consider the nonlinear operator
```math
    A \colon L^2([0,1]) \to \mathbb{R},\quad A(f) := \int_0^1 \sin(f(t)) f'(t)\, \mathrm{d}t
```

We implement this operator using the `ApproxFun` package:

```julia-repl
julia> using ApproxFun

julia> A(f) = sum(sin.(f)*f');

julia> A(Fun(sin, 0..1))
0.33363325460711935
```

**FrechetDiff** allows us to compute the derivative of this operator as follows:

```julia-repl
julia> program = record_function(A, 1);

julia> A´ = eval(emit_code(differentiate(program)));

julia> A´(Fun(sin, 0..1))(Fun(t -> t, 0..1))
0.7456241416655578
```
