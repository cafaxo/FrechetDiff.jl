import Base: +, -, *, sum, getindex, circshift
import LinearAlgebra: dot, adjoint

# rules for creating the computation graph

for op in (:+, :-, :*, :dot)
    @eval begin
        $op(a::TrackedValue, b::TrackedValue) = add_call!($op, Any[a, b])
        $op(a::TrackedValue, @nospecialize(b)) = add_call!($op, Any[a, b])
        $op(@nospecialize(a), b::TrackedValue) = add_call!($op, Any[a, b])
    end
end

for op in (:+, :-, :sum)
    @eval begin
        $op(x::TrackedValue) = add_call!($op, Any[x])
    end
end

import Base.Broadcast: broadcasted, materialize
import Base: map

broadcasted(f, x::TrackedValue, y...) = add_call!(broadcasted, Any[f, x, y...])

materialize(x::TrackedValue) = add_call!(materialize, Any[x])

map(f, x::TrackedValue, y...) = add_call!(map, Any[f, x, y...])

getindex(x::TrackedValue, i) = add_call!(getindex, Any[x, i])

adjoint(x::TrackedValue) = add_call!(adjoint, Any[x])

circshift(x::TrackedValue, i) = add_call!(circshift, Any[x, i])

eval_tracked(x, y) = x(y)
eval_tracked(x::TrackedValue, y) = add_call!(eval_tracked, Any[x, y])
(x::TrackedValue)(y) = eval_tracked(x, y)

# rules for differentiation

diff_rule(::typeof(getindex), ::Val{1}, x, i) = y -> y[i]
diff_rule(::typeof(eval_tracked), ::Val{1}, x, i) = y -> y(i)

diff_rule(::typeof(adjoint), ::Val{1}, x) = y -> adjoint(y)
diff_rule(::typeof(circshift), ::Val{1}, x, i) = y -> circshift(y, i)

diff_rule(::typeof(+), ::Val{1}, x1, x2) = identity
diff_rule(::typeof(+), ::Val{2}, x1, x2) = identity

diff_rule(::typeof(-), ::Val{1}, x1, x2) = identity
diff_rule(::typeof(-), ::Val{2}, x1, x2) = y -> -y

diff_rule(::typeof(*), ::Val{1}, x1, x2) = y -> y * x2
diff_rule(::typeof(*), ::Val{2}, x1, x2) = y -> x1 * y

diff_rule(::typeof(dot), ::Val{1}, x1, x2) = y -> dot(y, x2)
diff_rule(::typeof(dot), ::Val{2}, x1, x2) = y -> dot(x1, y)

diff_rule(::typeof(sum), ::Val{1}, x) = y -> sum(y)

function partial_derivative(f, x::Tuple, ::Val{i}) where i
    return ForwardDiff.derivative(t -> f(Base.setindex(x, t, i)...), x[i])
end

function diff_rule(::typeof(broadcasted), ::Val{i}, f, x...) where i
    s = Base.broadcasted((x_...,) -> partial_derivative(f, x_, Val(i-1)), x...)
    s = Base.materialize(s)

    return y -> s .* y
end

function diff_rule(::typeof(map), ::Val{i}, f, x...) where i
    i_minus_1 = Val(i-1)
    s = map((x_...,) -> partial_derivative(f, x_, i_minus_1), x...)

    return y -> map(*, s, y)
end

diff_rule(::typeof(broadcasted), ::Val{2}, ::typeof(*), x1, x2) = y -> y .* x2
diff_rule(::typeof(broadcasted), ::Val{3}, ::typeof(*), x1, x2) = y -> x1 .* y

diff_rule(::typeof(materialize), ::Val{1}, x) = identity
