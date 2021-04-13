struct SSparseVector{N,Ti,Tv}
    nzind::NTuple{N,Ti}
    nzval::NTuple{N,Tv}
    len::Int
end

Base.length(x::SSparseVector) = x.len

+(x::SSparseVector, y::SSparseVector) = SSparseVector((x.nzind..., y.nzind...), (x.nzval..., y.nzval...), x.len)

Base.map(f, x, y::SSparseVector{1}) = SSparseVector(y.nzind, (f(x[y.nzind[1]], y.nzval[1]),), y.len)

Base.broadcasted(f, x, y::SSparseVector{1}) = SSparseVector(y.nzind, (f(x[y.nzind[1]], y.nzval[1]),), y.len)

Base.broadcasted(f, x::SSparseVector{1}, y) = SSparseVector(x.nzind, (f(x.nzval[1], y[x.nzind[1]]),), x.len)

Base.broadcasted(f, x::SSparseVector{1}, y::SSparseVector{1}) = SSparseVector(x.nzind, (f(x.nzval[1], y[x.nzind[1]]),), x.len)

Base.sum(x::SSparseVector) = sum(x.nzval)

Base.eltype(x::SSparseVector) = eltype(x.nzval)

Base.getindex(x::SSparseVector{1}, i) = x.nzind[1] == i ? x.nzval[1] : zero(eltype(x))

function Base.setindex!(x::Matrix, y::SSparseVector, ::Colon, column::Int)
    map((ind, val) -> x[ind, column] += val, y.nzind, y.nzval)
    return x
end

function Base.circshift(x::SSparseVector{1}, i)
    j = x.nzind[1]
    newj = mod(j+i-1, length(x)) + 1

    return SSparseVector((newj,), x.nzval, length(x))
end

function materialize_hessian(f´´, x)
    n = length(x)
    f´´_x = f´´(x)

    H = zeros(n, n)
       
    for i in 1:n
        fi = f´´_x(SSparseVector((i,), (1.0,), n))
           
        for j in 1:n
            H[j,i] = fi(SSparseVector((j,), (1.0,), n))
        end
    end
       
    return H
end
