using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ArtistOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalFileReferenceFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExternalFileReferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerUserId = table.Column<int>(type: "integer", nullable: false),
                    SongId = table.Column<int>(type: "integer", nullable: true),
                    GoogleDriveConnectionId = table.Column<int>(type: "integer", nullable: true),
                    Provider = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ExternalId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ResourceType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    IsFolder = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    MimeType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LinkedResourceType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    LinkedResourceId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalFileReferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExternalFileReferences_GoogleDriveConnections_GoogleDriveCo~",
                        column: x => x.GoogleDriveConnectionId,
                        principalTable: "GoogleDriveConnections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ExternalFileReferences_Songs_SongId",
                        column: x => x.SongId,
                        principalTable: "Songs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExternalFileReferences_Users_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExternalFileReferences_GoogleDriveConnectionId",
                table: "ExternalFileReferences",
                column: "GoogleDriveConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalFileReferences_OwnerUserId",
                table: "ExternalFileReferences",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalFileReferences_OwnerUserId_Provider_ExternalId",
                table: "ExternalFileReferences",
                columns: new[] { "OwnerUserId", "Provider", "ExternalId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExternalFileReferences_OwnerUserId_Provider_ResourceType_So~",
                table: "ExternalFileReferences",
                columns: new[] { "OwnerUserId", "Provider", "ResourceType", "SongId" });

            migrationBuilder.CreateIndex(
                name: "IX_ExternalFileReferences_SongId",
                table: "ExternalFileReferences",
                column: "SongId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExternalFileReferences");
        }
    }
}
