import { gql } from '@/graphql';

/**
 * Report numbers from the stats resolvers. Each list argument holds several filters and returns one
 * result per filter, so per-class averages and the click buckets come back in this single request.
 */
export const TEACHER_REPORTS = gql(`
  query TeacherReports($points: [StatsFilter!]!, $classPoints: [StatsFilter!]!, $clicks: [StatsFilter!]!, $members: [StatsFilter!]!) {
    statsPoints(filters: $points) { points maxPoints }
    classPoints: statsPoints(filters: $classPoints) { points maxPoints }
    statsClicks(filters: $clicks) { clicks }
    statsMembers(filters: $members) { students teachers }
  }
`);
