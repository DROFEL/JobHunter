import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { ResumeData } from "@/components/resume-workbench/types.ts"

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  return `https://${trimmed}`
}

function formatLinkLabel(value: string, fallback: string) {
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "")
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28, paddingBottom: 28, paddingHorizontal: 22,
    fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.3, color: "#000",
  },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "center", lineHeight: 1.1 },
  role: { fontSize: 12, textAlign: "center", marginTop: 2 },
  contactRow: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "center",
    fontSize: 10.5, marginTop: 3,
  },
  contactItem: { marginHorizontal: 3 },
  summary: { marginTop: 8 },
  sectionWrap: { marginTop: 12 },
  sectionTitle: {
    fontSize: 11.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase",
    borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 1,
  },
  rowBetween: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginTop: 4,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  bullet: { flexDirection: "row", marginTop: 2 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
  link: { color: "#000", textDecoration: "underline" },
})

export function ClassicPdf({ data }: { data: ResumeData }) {
  const githubUrl = normalizeExternalUrl(data.profile.github)
  const linkedinUrl = normalizeExternalUrl(data.profile.linkedin)

  const contactItems = [
    <Text key="loc">Toronto, ON</Text>,
    data.profile.phone ? <Text key="phone">{data.profile.phone}</Text> : null,
    data.profile.email ? <Text key="email">{data.profile.email}</Text> : null,
    linkedinUrl ? (
      <Link key="linkedin" src={linkedinUrl} style={styles.link}>
        {formatLinkLabel(data.profile.linkedin, "LinkedIn")}
      </Link>
    ) : null,
    githubUrl ? (
      <Link key="github" src={githubUrl} style={styles.link}>
        {formatLinkLabel(data.profile.github, "GitHub")}
      </Link>
    ) : null,
  ].filter(Boolean) as React.ReactNode[]

  const edu = data.education.filter((i) => i.school.trim() || i.degree.trim() || i.year.trim())
  const languages = data.languages?.filter((l) => l.language.trim()) ?? []
  const skills = data.skillTypes.filter(
    (s) => s.name.trim() || s.skills.some((x) => x.trim()),
  )
  const experiences = data.experiences.filter(
    (e) => e.company.trim() || e.duration.trim() || e.points.some((p) => p.text.trim()),
  )
  const projects = data.projects.filter((p) => p.name.trim() || p.description.trim())

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.name}>{data.profile.name || "Your Name"}</Text>
        <Text style={styles.role}>
          {data.position || data.targetPosition || "Software Engineer"}
        </Text>

        <View style={styles.contactRow}>
          {contactItems.map((item, i) => (
            <View key={i} style={{ flexDirection: "row" }}>
              {i > 0 && <Text style={styles.contactItem}>|</Text>}
              <View style={styles.contactItem}>{item}</View>
            </View>
          ))}
        </View>

        {data.summary?.trim() ? <Text style={styles.summary}>{data.summary}</Text> : null}

        {edu.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Education:</Text>
            {edu.map((item) => (
              <View key={item.id} style={{ marginTop: 4 }}>
                <View style={styles.rowBetween}>
                  <Text>
                    <Text style={styles.bold}>{item.school || "Institution"}</Text>
                    {item.degree ? <Text>, {item.degree}</Text> : null}
                  </Text>
                  <Text style={styles.bold}>{item.year}</Text>
                </View>
                {item.description?.trim() ? (
                  <Text style={{ marginTop: 2, fontSize: 10.5, color: "#444" }}>{item.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Skills:</Text>
            {skills.map((skillType) => (
              <Text key={skillType.id} style={{ marginTop: 2 }}>
                <Text style={styles.bold}>{skillType.name || "Skills"}: </Text>
                <Text>{skillType.skills.filter((s) => s.trim()).join(", ")}</Text>
              </Text>
            ))}
          </View>
        )}

        {experiences.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Work Experience:</Text>
            {experiences.map((job) => (
              <View key={job.id} style={{ marginTop: 6 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.bold}>{job.company || "Company / Role"}</Text>
                  <Text style={styles.bold}>{job.duration}</Text>
                </View>
                {job.points
                  .filter((p) => p.text.trim())
                  .map((point) => (
                    <View key={point.id} style={styles.bullet}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{point.text}</Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        )}

        {projects.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Projects and Extracurricular Activities:</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>{project.name || "Project"}</Text>
                  {project.description ? <Text>: {project.description}</Text> : null}
                </Text>
              </View>
            ))}
          </View>
        )}

        {languages.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Languages:</Text>
            <Text style={{ marginTop: 2 }}>
              {languages.map((l, i) => (
                <Text key={l.id}>
                  {i > 0 ? <Text>{"  |  "}</Text> : null}
                  <Text style={styles.bold}>{l.language}</Text>
                  <Text>{" – "}{l.level}</Text>
                </Text>
              ))}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}