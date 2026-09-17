using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ArtistOS.Api.PostgresTests;

internal static class PostgresAssert
{
    public static async Task ConstraintViolationAsync(
        Func<Task> action,
        string sqlState,
        string constraintName)
    {
        var failure = await Assert.ThrowsAsync<DbUpdateException>(action);
        var postgres = Assert.IsType<PostgresException>(failure.GetBaseException());
        Assert.Equal(sqlState, postgres.SqlState);
        Assert.Equal(constraintName, postgres.ConstraintName);
    }

    public static async Task RawConstraintViolationAsync(
        Func<Task> action,
        string sqlState,
        string constraintName)
    {
        var postgres = await Assert.ThrowsAsync<PostgresException>(action);
        Assert.Equal(sqlState, postgres.SqlState);
        Assert.Equal(constraintName, postgres.ConstraintName);
    }
}
