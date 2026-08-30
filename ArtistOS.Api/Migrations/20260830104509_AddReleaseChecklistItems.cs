using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ArtistOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReleaseChecklistItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReleaseChecklistItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReleaseId = table.Column<int>(type: "integer", nullable: false),
                    Key = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Label = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReleaseChecklistItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReleaseChecklistItems_Releases_ReleaseId",
                        column: x => x.ReleaseId,
                        principalTable: "Releases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReleaseChecklistItems_ReleaseId",
                table: "ReleaseChecklistItems",
                column: "ReleaseId");

            migrationBuilder.CreateIndex(
                name: "IX_ReleaseChecklistItems_ReleaseId_Key",
                table: "ReleaseChecklistItems",
                columns: new[] { "ReleaseId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReleaseChecklistItems_ReleaseId_SortOrder",
                table: "ReleaseChecklistItems",
                columns: new[] { "ReleaseId", "SortOrder" });

            migrationBuilder.Sql(
                """
                INSERT INTO "ReleaseChecklistItems" (
                    "ReleaseId",
                    "Key",
                    "Label",
                    "IsCompleted",
                    "CompletedAt",
                    "Notes",
                    "SortOrder",
                    "CreatedAt",
                    "UpdatedAt"
                )
                SELECT
                    release."Id",
                    checklist."Key",
                    checklist."Label",
                    false,
                    NULL,
                    NULL,
                    checklist."SortOrder",
                    NOW(),
                    NOW()
                FROM "Releases" AS release
                CROSS JOIN (
                    VALUES
                        ('Master', 'Master', 0),
                        ('Cover', 'Cover', 1),
                        ('Metadata', 'Metadata', 2),
                        ('Credits', 'Credits', 3),
                        ('Canvas', 'Canvas', 4),
                        ('MusicVideo', 'Music Video', 5),
                        ('ContentPlan', 'Content Plan', 6)
                ) AS checklist("Key", "Label", "SortOrder")
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM "ReleaseChecklistItems" AS item
                    WHERE item."ReleaseId" = release."Id"
                        AND item."Key" = checklist."Key"
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReleaseChecklistItems");
        }
    }
}
