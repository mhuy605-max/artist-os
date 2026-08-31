using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArtistOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetFileUploadReferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExternalFileReferenceId",
                table: "VisualAssets",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SizeBytes",
                table: "ExternalFileReferences",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WebViewLink",
                table: "ExternalFileReferences",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExternalFileReferenceId",
                table: "AudioAssets",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_VisualAssets_ExternalFileReferenceId",
                table: "VisualAssets",
                column: "ExternalFileReferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioAssets_ExternalFileReferenceId",
                table: "AudioAssets",
                column: "ExternalFileReferenceId");

            migrationBuilder.AddForeignKey(
                name: "FK_AudioAssets_ExternalFileReferences_ExternalFileReferenceId",
                table: "AudioAssets",
                column: "ExternalFileReferenceId",
                principalTable: "ExternalFileReferences",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_VisualAssets_ExternalFileReferences_ExternalFileReferenceId",
                table: "VisualAssets",
                column: "ExternalFileReferenceId",
                principalTable: "ExternalFileReferences",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AudioAssets_ExternalFileReferences_ExternalFileReferenceId",
                table: "AudioAssets");

            migrationBuilder.DropForeignKey(
                name: "FK_VisualAssets_ExternalFileReferences_ExternalFileReferenceId",
                table: "VisualAssets");

            migrationBuilder.DropIndex(
                name: "IX_VisualAssets_ExternalFileReferenceId",
                table: "VisualAssets");

            migrationBuilder.DropIndex(
                name: "IX_AudioAssets_ExternalFileReferenceId",
                table: "AudioAssets");

            migrationBuilder.DropColumn(
                name: "ExternalFileReferenceId",
                table: "VisualAssets");

            migrationBuilder.DropColumn(
                name: "SizeBytes",
                table: "ExternalFileReferences");

            migrationBuilder.DropColumn(
                name: "WebViewLink",
                table: "ExternalFileReferences");

            migrationBuilder.DropColumn(
                name: "ExternalFileReferenceId",
                table: "AudioAssets");
        }
    }
}
