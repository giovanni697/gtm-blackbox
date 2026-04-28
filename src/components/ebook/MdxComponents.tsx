import type { MDXComponents } from 'mdx/types'
import { CalloutCertificacao } from './CalloutCertificacao'

export const mdxComponents: MDXComponents = {
  h1: ({ children, ...props }) => (
    <h1
      {...props}
      className="mt-12 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl"
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      {...props}
      className="mt-12 border-t border-scient-divider pt-8 font-sora text-xl font-medium text-scient-dark md:text-2xl"
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 {...props} className="mt-8 font-sora text-base font-semibold text-scient-dark md:text-lg">
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      {...props}
      className="mt-6 font-lexend text-2xs uppercase tracking-widest text-scient-primary"
    >
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p {...props} className="mt-5 font-sora text-sm leading-relaxed text-scient-dark md:text-base">
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul {...props} className="ml-6 mt-5 list-disc space-y-2 font-sora text-sm text-scient-dark">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol {...props} className="ml-6 mt-5 list-decimal space-y-2 font-sora text-sm text-scient-dark">
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li {...props} className="leading-relaxed">
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      {...props}
      className="my-8 border-l-2 border-scient-primary pl-5 font-sora text-base font-light italic leading-relaxed text-scient-dark md:text-lg"
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr {...props} className="my-12 border-scient-divider" />,
  a: ({ children, href, ...props }) => (
    <a
      {...props}
      href={href}
      className="text-scient-primary underline-offset-4 hover:underline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  strong: ({ children, ...props }) => (
    <strong {...props} className="font-semibold">
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em {...props} className="italic">
      {children}
    </em>
  ),
  table: ({ children, ...props }) => (
    <div className="not-prose my-10 overflow-x-auto">
      <table
        {...props}
        className="w-full border-collapse text-left font-sora text-xs md:text-sm [&_tbody_td:first-child]:font-medium [&_tbody_td:first-child]:text-[#111] [&_tbody_tr:hover]:bg-[#F5F5F7] [&_tbody_tr:last-child]:border-b-0 [&_tbody_tr]:border-b [&_tbody_tr]:border-[#E6E6E6]"
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead {...props} className="bg-[#A0B0E8]">
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      {...props}
      className="border-b border-[#0030E8]/20 px-4 py-3 text-left font-sora text-xs font-semibold text-[#111] md:text-sm"
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      {...props}
      className="px-4 py-3 align-top font-sora text-xs leading-relaxed text-[#111] md:text-sm"
    >
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
  code: ({ children, ...props }) => (
    <code
      {...props}
      className="border border-scient-divider bg-scient-bg px-1.5 py-0.5 font-mono text-xs"
    >
      {children}
    </code>
  ),
  CalloutCertificacao,
}
