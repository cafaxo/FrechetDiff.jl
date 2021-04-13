# FrechetDiff.jl

**FrechetDiff** is an experimental [Julia](http://julialang.org) package for automatic differentiation (AD).

Given a Julia function `f`, **FrechetDiff** automatically generates another Julia function `f´`.
In contrast to other AD packages like [**ForwardDiff**](https://github.com/JuliaDiff/ForwardDiff.jl), `f´(x)` does not return the Jacobian matrix.
Instead, `f´(x)` returns an anonymous Julia function (a closure) that computes the directional derivative $f'(x) v$ when evaluated at $v$.

The idea behind **FrechetDiff** is to do most of the expensive computations when calling `f´`.
Intermediate results are then passed to the closure that is returned from `f´(x)`, making the evaluation of the directional derivatives as cheap as possible.

An advantage of this approach is that it is oblivious to how the vectors are represented: Vectors are not required to be of type `AbstractArray`.

Higher-order derivatives are supported.
The result of evaluating an $n$-th derivative $f^{(n)}$ at a point $x$ is a multilinear map.
This multilinear map is represented via nested closures.

* Go to [Examples](@ref) to learn how **FrechetDiff** is used.
* Go to [How it works](@ref) to learn what is going on behind the scenes.

### Authors

- Lukas Mayrhofer

### Installation

**FrechetDiff** is not a registered package yet. Currently, it can be installed by running

```julia-repl
pkg> add https://github.com/cafaxo/FrechetDiff.jl
```
