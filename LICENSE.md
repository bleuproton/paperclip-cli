# Paperclip CLI Public License v1.0 (PCPL-1.0)

Copyright (c) 2026 Gregory Gilds and Paperclip CLI contributors

## TL;DR

Copy it. Modify it. Run it. Ship it.
**But:** if you change it, keep the source open and help the upstream project move forward.
You cannot take this code, make it private, and sell it as your own.

## 1. Grant of rights

Subject to the conditions below, anyone is granted a worldwide, royalty-free,
perpetual, irrevocable license to:

a) **Use** the software for any purpose, including commercial.
b) **Copy** and redistribute the software in source or binary form.
c) **Modify** the software and create derivative works.
d) **Sublicense** through redistribution under this same license.

## 2. Conditions — what you owe back

These conditions apply to anyone who modifies or distributes the software,
or runs a modified version as a service available to users beyond your own
organization.

### 2.1 Stay open

Any modification you ship to others, or run as a network-accessible service,
must remain available in source form under this same Paperclip CLI Public
License. You may not "close" the source by:

- Distributing only binaries without source.
- Hosting a modified version as a service without exposing the source.
- Applying proprietary licenses, NDA gates, paywalls on the source, or
  other access restrictions inconsistent with this license.
- Stripping copyright notices or this license file.

### 2.2 Contribute back, or maintain a public fork

If you ship a derivative work, you must do **at least one** of:

a) **Submit improvements upstream.** Open a pull request against the
   canonical repository (`github.com/bleuproton/paperclip-cli` or its
   successor as named in this file) for each non-trivial change, in good
   faith. "Non-trivial" means anything beyond cosmetic edits, version
   bumps, or local config.

b) **Maintain a public fork.** Host your fork in a publicly accessible
   git repository with full history, accept pull requests from the
   community, and document where it can be found in your distribution.

c) **Help design the next version.** Participate in upstream design
   discussions (issues, RFCs, governance threads) and demonstrate
   meaningful contribution within 90 days of distributing your derivative.

You must declare which path you have chosen in a `LICENSE-COMPLIANCE.md`
file in your distribution.

### 2.3 No proprietary lock-in

You may not combine this software with proprietary code in a way that
makes the combined work effectively closed-source, including but not
limited to:

- Linking as a library inside a closed-source binary.
- Wrapping in a closed-source API gateway whose only purpose is to obscure
  the underlying use of this software.
- Including in a commercial product whose terms forbid users from
  inspecting or modifying the included copy.

### 2.4 Trademark and naming

The names "Paperclip CLI", "paperclip-cli", and any associated logos are
not licensed for use to identify your derivative work unless your
derivative is officially endorsed upstream. Pick your own name for your
fork.

## 3. Termination

If you violate any condition above and do not cure the violation within 30
days of receiving written notice (including via GitHub issue), your rights
under this license terminate automatically. Rights of downstream users who
received the software in good faith are not affected.

Your rights may be reinstated upon explicit written grant from the
copyright holders.

## 4. Compatibility

This license is intentionally stricter than MIT and looser than AGPL-3.0.
Code under this license may be combined with code under:

- MIT, BSD, Apache 2.0 — yes, the combined work must ship under PCPL-1.0.
- GPL family — only if the GPL version allows additional terms (GPLv3+
  with this license as an "additional permission" / "additional
  requirement" under section 7).
- AGPL — likely compatible, similar copyleft intent.
- Proprietary — no, unless that code is also released under PCPL-1.0.

If in doubt, ask upstream before mixing.

## 5. Warranty disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE,
ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

## 6. Why this license exists

Most "free" software licenses optimize for one of two things: maximum
adoption (MIT) or maximum upstream protection (GPL/AGPL). This license
sits in the middle on purpose.

We want:

- Anyone to be able to use the CLI without friction.
- People who improve it to share what they improve.
- A healthy public commons where forks help, not fragment.
- Nobody to take this code, slap a logo on it, and sell it as private SaaS
  without contributing back.

If you want to use this in a commercial product: yes, you can. Just keep
your modifications open and help us make the next version better.

That's the deal.

## 7. Contact

For licensing questions, dual-license requests, or trademark inquiries:
open an issue at `github.com/bleuproton/paperclip-cli`.
