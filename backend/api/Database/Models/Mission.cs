﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

#nullable disable
namespace Api.Database.Models
{
    public class Mission
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public string Id { get; set; }

        public string AssetCode { get; set; }

        [Required]
        public virtual Robot Robot { get; set; }

        [MaxLength(128)]
        public string IsarMissionId { get; set; }

        [MaxLength(128)]
        [Required]
        public int EchoMissionId { get; set; }

        [Required]
        public MissionStatus MissionStatus { get; set; }

        [Required]
        public DateTimeOffset StartTime { get; set; }

        public DateTimeOffset EndTime { get; set; }

        [Required]
        public IList<IsarTask> Tasks { get; set; }

        [Required]
        public IList<PlannedTask> PlannedTasks { get; set; }

#nullable enable
        public IsarTask? ReadIsarTaskById(string isarTaskId)
        {
            return Tasks.FirstOrDefault(
                task => task.IsarTaskId.Equals(isarTaskId, StringComparison.Ordinal)
            );
        }

#nullable disable

        public static MissionStatus MissionStatusFromString(string status)
        {
            return status switch
            {
                "completed" => MissionStatus.Successful,
                "not_started" => MissionStatus.Pending,
                "in_progress" => MissionStatus.Ongoing,
                "failed" => MissionStatus.Failed,
                "cancelled" => MissionStatus.Cancelled,
                "paused" => MissionStatus.Paused,
                _
                  => throw new ArgumentException(
                      $"Failed to parse mission status '{status}' as it's not supported"
                  )
            };
        }
    }

    public enum MissionStatus
    {
        Pending,
        Ongoing,
        Paused,
        Aborted,
        Cancelled,
        Failed,
        Successful
    }
}
