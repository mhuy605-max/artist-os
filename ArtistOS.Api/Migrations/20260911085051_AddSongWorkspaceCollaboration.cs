using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ArtistOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSongWorkspaceCollaboration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SongInvitations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    InvitedUserId = table.Column<int>(type: "integer", nullable: false),
                    InvitedByUserId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongInvitations", x => x.Id);
                    table.CheckConstraint("CK_SongInvitations_Role", "\"Role\" IN ('EDITOR', 'VIEWER')");
                    table.CheckConstraint("CK_SongInvitations_Status", "\"Status\" IN ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED')");
                    table.ForeignKey(
                        name: "FK_SongInvitations_Songs_SongId",
                        column: x => x.SongId,
                        principalTable: "Songs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SongInvitations_Users_InvitedByUserId",
                        column: x => x.InvitedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SongInvitations_Users_InvitedUserId",
                        column: x => x.InvitedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SongMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongMembers", x => x.Id);
                    table.CheckConstraint("CK_SongMembers_Role", "\"Role\" IN ('EDITOR', 'VIEWER')");
                    table.ForeignKey(
                        name: "FK_SongMembers_Songs_SongId",
                        column: x => x.SongId,
                        principalTable: "Songs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SongMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SongInvitations_InvitedByUserId",
                table: "SongInvitations",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SongInvitations_InvitedUserId",
                table: "SongInvitations",
                column: "InvitedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SongInvitations_SongId",
                table: "SongInvitations",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_SongInvitations_SongId_InvitedUserId_Pending",
                table: "SongInvitations",
                columns: new[] { "SongId", "InvitedUserId" },
                unique: true,
                filter: "\"Status\" = 'PENDING'");

            migrationBuilder.CreateIndex(
                name: "IX_SongInvitations_Status",
                table: "SongInvitations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SongMembers_SongId",
                table: "SongMembers",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_SongMembers_SongId_UserId",
                table: "SongMembers",
                columns: new[] { "SongId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SongMembers_UserId",
                table: "SongMembers",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SongInvitations");

            migrationBuilder.DropTable(
                name: "SongMembers");
        }
    }
}
