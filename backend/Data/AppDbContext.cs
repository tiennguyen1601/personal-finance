using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Category>()
            .Property(c => c.Type).HasConversion<string>();

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Type).HasConversion<string>();

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount).HasColumnType("decimal(18,2)");
    }
}
