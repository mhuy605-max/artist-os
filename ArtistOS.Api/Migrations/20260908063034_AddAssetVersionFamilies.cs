using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArtistOS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetVersionFamilies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssetFamilyId",
                table: "VisualAssets",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "AssetFamilyId",
                table: "AudioAssets",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.Sql(
                """
                UPDATE "VisualAssets"
                SET "AssetFamilyId" = (
                    substr(md5('visual-asset-' || "Id"::text), 1, 8) || '-' ||
                    substr(md5('visual-asset-' || "Id"::text), 9, 4) || '-' ||
                    substr(md5('visual-asset-' || "Id"::text), 13, 4) || '-' ||
                    substr(md5('visual-asset-' || "Id"::text), 17, 4) || '-' ||
                    substr(md5('visual-asset-' || "Id"::text), 21, 12)
                )::uuid;
                """);

            migrationBuilder.Sql(
                """
                WITH audio_groups AS (
                    SELECT
                        "SongId",
                        "Type",
                        COUNT(*) AS row_count,
                        COUNT(DISTINCT "Version") AS version_count,
                        SUM(CASE WHEN "IsCurrent" THEN 1 ELSE 0 END) AS current_count,
                        MIN("Id") AS first_id
                    FROM "AudioAssets"
                    GROUP BY "SongId", "Type"
                )
                UPDATE "AudioAssets" AS audio
                SET "AssetFamilyId" = CASE
                    WHEN audio_groups.row_count = audio_groups.version_count
                         AND audio_groups.current_count <= 1
                    THEN (
                        substr(md5('audio-family-' || audio_groups.first_id::text), 1, 8) || '-' ||
                        substr(md5('audio-family-' || audio_groups.first_id::text), 9, 4) || '-' ||
                        substr(md5('audio-family-' || audio_groups.first_id::text), 13, 4) || '-' ||
                        substr(md5('audio-family-' || audio_groups.first_id::text), 17, 4) || '-' ||
                        substr(md5('audio-family-' || audio_groups.first_id::text), 21, 12)
                    )::uuid
                    ELSE (
                        substr(md5('audio-asset-' || audio."Id"::text), 1, 8) || '-' ||
                        substr(md5('audio-asset-' || audio."Id"::text), 9, 4) || '-' ||
                        substr(md5('audio-asset-' || audio."Id"::text), 13, 4) || '-' ||
                        substr(md5('audio-asset-' || audio."Id"::text), 17, 4) || '-' ||
                        substr(md5('audio-asset-' || audio."Id"::text), 21, 12)
                    )::uuid
                END
                FROM audio_groups
                WHERE audio."SongId" = audio_groups."SongId"
                  AND audio."Type" = audio_groups."Type";
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "AssetFamilyId",
                table: "VisualAssets",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<Guid>(
                name: "AssetFamilyId",
                table: "AudioAssets",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_VisualAssets_AssetFamilyId_Current",
                table: "VisualAssets",
                column: "AssetFamilyId",
                unique: true,
                filter: "\"IsCurrent\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_VisualAssets_AssetFamilyId_Version",
                table: "VisualAssets",
                columns: new[] { "AssetFamilyId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AudioAssets_AssetFamilyId_Current",
                table: "AudioAssets",
                column: "AssetFamilyId",
                unique: true,
                filter: "\"IsCurrent\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_AudioAssets_AssetFamilyId_Version",
                table: "AudioAssets",
                columns: new[] { "AssetFamilyId", "Version" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VisualAssets_AssetFamilyId_Current",
                table: "VisualAssets");

            migrationBuilder.DropIndex(
                name: "IX_VisualAssets_AssetFamilyId_Version",
                table: "VisualAssets");

            migrationBuilder.DropIndex(
                name: "IX_AudioAssets_AssetFamilyId_Current",
                table: "AudioAssets");

            migrationBuilder.DropIndex(
                name: "IX_AudioAssets_AssetFamilyId_Version",
                table: "AudioAssets");

            migrationBuilder.DropColumn(
                name: "AssetFamilyId",
                table: "VisualAssets");

            migrationBuilder.DropColumn(
                name: "AssetFamilyId",
                table: "AudioAssets");
        }
    }
}
