import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'

const UPDATED = '18 November 2026'

type Section = { id: string; title: string; body: ReactNode }

const documents = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/child-safety', label: 'Child safety' },
]

function LegalPage({
  title,
  summary,
  sections,
}: {
  title: string
  summary: string
  sections: Section[]
}) {
  const location = useLocation()
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-base" aria-hidden>
              🌱
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold tracking-tight text-primary">NeuroBloom</span>
              <span className="block text-[8px] font-semibold tracking-[0.16em] text-muted-foreground">LEARNINGSPHERE</span>
            </span>
          </Link>
          <nav aria-label="Legal documents" className="flex items-center gap-1 text-[11px] font-semibold">
            {documents.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  item.to === location.pathname
                    ? 'rounded-lg bg-primary/10 px-2.5 py-2 text-primary'
                    : 'rounded-lg px-2.5 py-2 text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto grid max-w-5xl gap-10 px-4 py-10 outline-none sm:px-8 lg:grid-cols-[210px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft size={13} /> Back to NeuroBloom
            </Link>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">On this page</p>
            <ol className="space-y-1.5">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block rounded-md py-1 text-[11px] leading-snug text-muted-foreground hover:text-foreground"
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="max-w-3xl">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground lg:hidden"
          >
            <ArrowLeft size={13} /> Back to NeuroBloom
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{summary}</p>
          <p className="mt-3 text-[11px] font-medium text-muted-foreground">Last updated {UPDATED} · Nigeria Data Protection Act 2023</p>

          <div className="mt-8 space-y-9">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-base font-bold text-foreground">
                  {index + 1}. {section.title}
                </h2>
                <div className="mt-2.5 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
                  {section.body}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Mail size={15} className="text-primary" /> Questions or requests
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              Email{' '}
              <a href="mailto:support@neurobloom.ng" className="font-semibold text-primary hover:underline">
                support@neurobloom.ng
              </a>{' '}
              and we will respond within two working days. For data protection requests, include the account email so we
              can confirm ownership.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] font-semibold">
            {documents
              .filter((item) => item.to !== location.pathname)
              .map((item) => (
                <Link key={item.to} to={item.to} className="inline-flex items-center gap-1 text-primary hover:underline">
                  {item.label} <ArrowRight size={12} />
                </Link>
              ))}
          </div>
        </article>
      </main>

      <footer className="border-t border-border bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-[10px] font-medium text-muted-foreground">
          <span>© {new Date().getFullYear()} NeuroBloom LearningSphere</span>
          <div className="flex flex-wrap gap-4">
            {documents.map((item) => (
              <Link key={item.to} to={item.to} className="py-2 hover:text-foreground">
                {item.label}
              </Link>
            ))}
            <a href="mailto:support@neurobloom.ng" className="py-2 hover:text-foreground">
              Contact support
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* --------------------------------- Privacy -------------------------------- */

const privacySections: Section[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <>
        <p>
          NeuroBloom LearningSphere ("NeuroBloom", "we") runs a learning website and mobile app for junior and senior
          secondary students, their parents or guardians, and teachers and tutors. We are the data controller for the
          information described here, and we handle it under the Nigeria Data Protection Act 2023.
        </p>
      </>
    ),
  },
  {
    id: 'who-covers',
    title: 'Who this policy covers',
    body: (
      <p>
        Learners on the junior, senior and special-needs pathways; the parent or guardian responsible for a learner
        account; teachers and tutors; and the administrators who support the platform. It covers everything you enter
        into NeuroBloom and the records the platform creates as you use it.
      </p>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'What we collect',
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <span className="font-semibold text-foreground">Account details:</span> full name, email address, phone
          number and role. Passwords are stored only as salted hashes by our authentication provider — we never see the
          password itself.
        </li>
        <li>
          <span className="font-semibold text-foreground">Learner and family details:</span> a child's name, class
          level, subjects, learning preferences, and any special-needs information or reports that a parent chooses to
          share.
        </li>
        <li>
          <span className="font-semibold text-foreground">Learning records:</span> class membership, assignments and
          submissions, scores and feedback, attendance, quiz results, tutor bookings and messages sent inside the
          platform.
        </li>
        <li>
          <span className="font-semibold text-foreground">Payments:</span> the plan, amount, currency, payment reference
          and status. Card details are entered on Paystack's checkout and are never stored by NeuroBloom.
        </li>
        <li>
          <span className="font-semibold text-foreground">Teacher verification:</span> identity and qualification
          documents you upload, kept in private storage.
        </li>
        <li>
          <span className="font-semibold text-foreground">Technical data:</span> sign-in times, device and browser type,
          and error logs used to keep the service working and secure.
        </li>
      </ul>
    ),
  },
  {
    id: 'why-we-use-it',
    title: 'Why we use it, and our lawful basis',
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <span className="font-semibold text-foreground">To run your account and the learning experience</span>{' '}
          (contract): sign-in, classes, assignments, grading, attendance, messaging and support.
        </li>
        <li>
          <span className="font-semibold text-foreground">To keep children safe</span> (legal obligation and legitimate
          interest): guardian verification, moderation of reports, and safeguarding records.
        </li>
        <li>
          <span className="font-semibold text-foreground">To take payments</span> (contract): processing subscriptions
          and tutoring payments through Paystack.
        </li>
        <li>
          <span className="font-semibold text-foreground">Sensitive information about a child's needs</span> (explicit
          consent): used only to adapt lessons and support, never for advertising.
        </li>
        <li>
          <span className="font-semibold text-foreground">To improve and secure the service</span> (legitimate
          interest): error monitoring, abuse prevention and aggregate usage statistics.
        </li>
      </ul>
    ),
  },
  {
    id: 'children',
    title: 'Children and parental consent',
    body: (
      <p>
        Learners are usually under 18. A learner account is created only after a parent or guardian verifies a one-time
        code sent to their phone or email, and that verification stands as consent to collect the learner's data for the
        purposes above. A guardian may withdraw consent at any time by writing to us; the learner account is then
        deactivated and its data deleted or anonymised, except records we must keep by law. See the{' '}
        <Link to="/child-safety" className="font-semibold text-primary hover:underline">
          child safety page
        </Link>{' '}
        for how we restrict who a child can talk to.
      </p>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share it with',
    body: (
      <>
        <p>We do not sell personal data. We share it only with service providers who help run NeuroBloom:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-semibold text-foreground">Supabase</span> — database, authentication and private file
            storage, hosted in the European Union (eu-central-1).
          </li>
          <li>
            <span className="font-semibold text-foreground">Vercel</span> — web hosting and serverless functions.
          </li>
          <li>
            <span className="font-semibold text-foreground">Paystack</span> — card and bank payments, under its own
            privacy terms.
          </li>
          <li>
            <span className="font-semibold text-foreground">Our email and SMS providers</span> — used only to deliver
            account codes, receipts and support replies.
          </li>
        </ul>
        <p className="mt-2">
          We may also disclose information where the law requires it, or where it is necessary to protect a child from
          serious harm. Within NeuroBloom, a learner's records are visible only to that learner, their guardians, the
          teachers of their classes, and administrators who need access to support the account.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <p>
        We keep records while the account is active. If an account is deleted, personal data is removed within 30 days,
        except payment records and safeguarding notes, which are kept for as long as Nigerian financial and legal rules
        require. Backups are overwritten on the same schedule as the service that holds them.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'How we protect it',
    body: (
      <p>
        Data is encrypted in transit. Access is enforced in the database itself, so one account cannot read another
        family's records, and grading, payments and attendance can only be changed by the people entitled to change them.
        Verification documents sit in a private bucket and are shared only through short-lived links. Administrators use
        named accounts with no shared passwords.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <>
        <p>You can ask us to:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>confirm what we hold about you or your child, and give you a copy;</li>
          <li>correct information that is wrong;</li>
          <li>delete an account and its data, subject to records we must keep;</li>
          <li>restrict or object to certain uses, or withdraw consent for sensitive information;</li>
          <li>provide your data in a portable format.</li>
        </ul>
        <p className="mt-2">
          Write to{' '}
          <a href="mailto:support@neurobloom.ng" className="font-semibold text-primary hover:underline">
            support@neurobloom.ng
          </a>{' '}
          from the account email. We respond within 30 days. If you are not satisfied, you may complain to the Nigeria
          Data Protection Commission (ndpc.gov.ng).
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and local storage',
    body: (
      <p>
        We use your browser's local storage to keep you signed in and to remember preferences such as your chosen theme
        and dismissed prompts. There are no advertising cookies or third-party trackers on NeuroBloom. Clearing your
        browser storage signs you out.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        If we change how we handle personal data we will update this page and note the date at the top. Material changes
        that affect children's accounts will be sent to the guardian's email before they take effect.
      </p>
    ),
  },
]

export function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="What NeuroBloom collects, why, who can see it, and how to get it changed or deleted — written for families, teachers and tutors in plain English."
      sections={privacySections}
    />
  )
}

/* ---------------------------------- Terms --------------------------------- */

const termsSections: Section[] = [
  {
    id: 'agreement',
    title: 'Agreement to these terms',
    body: (
      <p>
        By creating an account or using NeuroBloom LearningSphere you agree to these terms and to the{' '}
        <Link to="/privacy" className="font-semibold text-primary hover:underline">
          Privacy Policy
        </Link>
        . If you are under 18, a parent or guardian must also agree, and their verification of your sign-up code is that
        agreement.
      </p>
    ),
  },
  {
    id: 'eligibility',
    title: 'Who can use NeuroBloom',
    body: (
      <p>
        Learner accounts are for secondary-school students. Where a learner is under 18, the account must name a parent
        or guardian who is responsible for it and who verifies the learner's sign-up. Teacher and tutor accounts are for
        adults working with learners. You must give accurate information and keep it up to date.
      </p>
    ),
  },
  {
    id: 'accounts',
    title: 'Your account',
    body: (
      <p>
        One person, one account. Do not share your password or let anyone else use your login, and tell us promptly if
        you believe someone has accessed your account. You are responsible for activity that happens through your
        account, and guardians are responsible for the accounts they create for their children.
      </p>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <>
        <p>NeuroBloom is a learning space. You agree not to:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>harass, threaten, bully or discriminate against anyone, including in messages;</li>
          <li>pose as another person or create an account for someone without their knowledge;</li>
          <li>share sexual, violent, hateful or illegal content, or content that is not yours to share;</li>
          <li>attempt to access another account, or probe or bypass the platform's security;</li>
          <li>scrape, copy or resell the service, curriculum or other users' data;</li>
          <li>use the platform to send spam or to advertise unrelated products.</li>
        </ul>
        <p className="mt-2">
          We may remove content, suspend or close an account that breaks these rules, and we will report serious
          safeguarding concerns to the appropriate authorities.
        </p>
      </>
    ),
  },
  {
    id: 'learning-content',
    title: 'Learning content',
    body: (
      <p>
        Lessons, quizzes and assignments are provided for education. They are not a substitute for your school's
        curriculum, for professional educational assessment, or for medical or therapeutic advice, and we do not
        guarantee any particular exam result. Content for ASD and ADHD learners is supplementary support adapted for the
        platform, not diagnosis or treatment.
      </p>
    ),
  },
  {
    id: 'teachers',
    title: 'Teachers and tutors',
    body: (
      <p>
        Teachers and tutors work as independent educators. A "verified" badge means we have reviewed identity and
        qualification documents; it is not an endorsement of teaching quality. Tutors set their rates and availability,
        sessions are confirmed in the platform, and payments are processed through Paystack. Messages between a learner
        and a tutor are possible only after the learner requests that tutor and the tutor accepts.
      </p>
    ),
  },
  {
    id: 'payments',
    title: 'Plans, billing and refunds',
    body: (
      <>
        <p>
          Subscription prices are shown in Naira at checkout and are charged monthly through Paystack until cancelled.
          Cancelling stops the next renewal; it does not refund the current month. Add-ons are charged once unless the
          checkout says otherwise. If a charge is wrong, contact us within 30 days and we will investigate with Paystack.
        </p>
        <p>
          Nothing in this section removes any refund right you have under Nigerian consumer protection law.
        </p>
      </>
    ),
  },
  {
    id: 'content-ownership',
    title: 'Content and intellectual property',
    body: (
      <p>
        You keep ownership of the work you upload, and you give us permission to store and display it inside NeuroBloom
        for the people entitled to see it. Do not upload someone else's work or personal information without their
        permission. The NeuroBloom name, brand, curriculum materials and software remain ours.
      </p>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and changes',
    body: (
      <p>
        We work to keep NeuroBloom available, but maintenance, upgrades or outages may interrupt it. We may add, change
        or retire features. If we make a material change to a paid plan, we will tell you before the next renewal.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Liability',
    body: (
      <p>
        To the extent Nigerian law allows, NeuroBloom is provided "as is" and we are not liable for indirect or
        consequential loss, or for loss caused by something outside our reasonable control. Where liability applies, it
        is limited to the fees paid for the affected account in the twelve months before the claim. Nothing here limits
        liability that cannot be limited by law, including for fraud or for death or personal injury caused by
        negligence.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Ending your account',
    body: (
      <p>
        You can stop using NeuroBloom at any time. We may suspend or close an account that breaks these terms, that we
        are required to close by law, or that poses a risk to another user — a child's safety in particular. When an
        account closes, data is handled as described in the Privacy Policy.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'Governing law and disputes',
    body: (
      <p>
        These terms are governed by the laws of the Federal Republic of Nigeria, and the Nigerian courts have
        jurisdiction over any dispute. Please write to us first at{' '}
        <a href="mailto:support@neurobloom.ng" className="font-semibold text-primary hover:underline">
          support@neurobloom.ng
        </a>{' '}
        so we can try to resolve it.
      </p>
    ),
  },
]

export function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      summary="The rules for using NeuroBloom — accounts, conduct, teachers, plans and payments, and how disputes are handled."
      sections={termsSections}
    />
  )
}

/* ------------------------------- Child safety ----------------------------- */

const childSafetySections: Section[] = [
  {
    id: 'approach',
    title: 'Our approach',
    body: (
      <p>
        NeuroBloom exists for children, including children with autism, ADHD and other learning needs. Safety is a design
        requirement, not an add-on: accounts for learners are opened only with a guardian's verification, and a child's
        records are visible only to the adults who need them to teach or care for that child.
      </p>
    ),
  },
  {
    id: 'guardian-consent',
    title: 'Parent or guardian consent',
    body: (
      <p>
        Every learner account names a parent or guardian, and sign-up is completed only when that guardian receives and
        shares a one-time code sent to their phone or email. Sharing the code confirms the guardian knows the account
        exists and agrees to NeuroBloom holding the child's learning data. A guardian can withdraw consent at any time by
        emailing us; the account is then deactivated.
      </p>
    ),
  },
  {
    id: 'who-can-message',
    title: 'Who a child can talk to',
    body: (
      <>
        <p>There is no open inbox on NeuroBloom. A learner can start or receive a conversation only with:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>teachers of the child's own classes;</li>
          <li>tutors the learner asked for and who accepted the request;</li>
          <li>the NeuroBloom admin team, for support and safeguarding.</li>
        </ul>
        <p className="mt-2">
          Those relationships are checked by the platform itself, so a stranger cannot begin a conversation with a child
          by typing their name or email. Messages are visible only to the two people in the conversation — the admin
          team does not read them by default.
        </p>
      </>
    ),
  },
  {
    id: 'what-is-visible',
    title: 'What is visible to others',
    body: (
      <p>
        There are no public profiles for learners, and learners do not upload photographs. Leaderboards and class pages
        are shown inside the signed-in portal to the learner's own cohort. Reports and special-needs details are visible
        to the child's guardians and teachers, not to other families.
      </p>
    ),
  },
  {
    id: 'special-needs',
    title: 'Information about a child’s needs',
    body: (
      <p>
        Special-needs information is shared voluntarily by a parent so lessons can be adapted: for example, sensory
        preferences, attention strategies or a specialist report. It is used only for that purpose, is never shown
        publicly or used for advertising, and can be removed by the guardian at any time. It is treated as sensitive
        personal data and handled under explicit consent.
      </p>
    ),
  },
  {
    id: 'reporting',
    title: 'Reporting a concern',
    body: (
      <p>
        If something on NeuroBloom worries you — a message, a session, a piece of content, or another user's conduct —
        email{' '}
        <a href="mailto:support@neurobloom.ng" className="font-semibold text-primary hover:underline">
          support@neurobloom.ng
        </a>{' '}
        or use Special Support in the parent portal. We acknowledge safeguarding reports within one working day. If a
        child is in immediate danger, contact the police or your local child protection service first.
      </p>
    ),
  },
  {
    id: 'adults-accounts',
    title: 'Adults who work with children',
    body: (
      <p>
        Teachers can join a learner's classes and message guardians; tutors can accept requests from learners. Teachers
        and tutors submit identity and qualification documents, which the admin team reviews before a verification badge
        appears. We may suspend any adult account reported to us while we investigate.
      </p>
    ),
  },
  {
    id: 'guardian-controls',
    title: 'What guardians can do',
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>see their child's classes, assignments, grades, attendance and progress;</li>
        <li>choose or change the subscription plan;</li>
        <li>withdraw consent and ask for the child's account to be deactivated or deleted;</li>
        <li>ask for a copy of everything NeuroBloom holds about the child.</li>
      </ul>
    ),
  },
]

export function ChildSafety() {
  return (
    <LegalPage
      title="Child Safety"
      summary="How NeuroBloom keeps children safe: guardian consent, who a child can talk to, what is private, and how to report a concern."
      sections={childSafetySections}
    />
  )
}
