# Limitations

We want to make users aware of an issue that can arise from incorrect usage of `eval(emit_code(program))`.

Consider the following code:

```julia
function do_something(f´)
    # do something with f´
end

function this_wont_work(program, x)
    program_diff = differentiate(program)
    f´ = eval(emit_code(program_diff))

    do_something(f´) # this will throw a world-age error
end
```

The world-age error arises from the fact that the Julia function `f´` is compiled during the evaluation of `this_wont_work`.
This implies that `f´` lives in different *world* than `this_wont_work` and thus cannot be directly used in `this_wont_work`.
More on world-age can be learned in the paper [World Age in Julia: Optimizing Method Dispatch in the Presence of Eval](https://arxiv.org/abs/2010.07516).

The correct way to work around this issue is by using `Base.invokelatest`:

```julia
function do_something(f´)
    # do something with f´
end

function this_will_work(program, x)
    program_diff = differentiate(program)
    f´ = eval(emit_code(program_diff))

    Base.invokelatest(do_something, f´) # this works just fine
end
```

Note that this issue does not arise when using **FrechetDiff** interactively in the Julia REPL as we do in [Examples](@ref).

**Why do other automatic differentiation tools not suffer from the same issue?**

Packages like [**Zygote**](https://github.com/FluxML/Zygote.jl) also generate Julia code on-the-fly.
However, **Zygote** uses `@generated` functions and thereby does not require the user to call `eval` in the first place.

In the future, we will explore using `@generated` functions in **FrechetDiff** to work around this issue.
