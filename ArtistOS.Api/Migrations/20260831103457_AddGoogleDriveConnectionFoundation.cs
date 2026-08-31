using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ArtistOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleDriveConnectionFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GoogleDriveConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    GoogleSubject = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    GoogleEmail = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    GoogleEmailVerified = table.Column<bool>(type: "boolean", nullable: false),
                    ProtectedRefreshToken = table.Column<string>(type: "text", nullable: true),
                    GrantedScopes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    RootFolderId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ConnectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSuccessfulRefreshAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GoogleDriveConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GoogleDriveConnections_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GoogleDriveConnections_UserId",
                table: "GoogleDriveConnections",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GoogleDriveConnections_UserId_GoogleSubject",
                table: "GoogleDriveConnections",
                columns: new[] { "UserId", "GoogleSubject" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GoogleDriveConnections");
        }
    }
}
