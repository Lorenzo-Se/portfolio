"use client";

import { contact } from "@/app/data/contact";
import { Magnetic } from "@/app/components/motion/Magnetic";
import { ChapterStage } from "@/app/components/ui/ChapterStage";
import { PortraitCloud } from "@/app/components/contact/PortraitCloud";

type ContactStageProps = {
  reduced: boolean;
};

export function ContactStage({ reduced }: ContactStageProps) {
  return (
    <ChapterStage id="contact" index="05" title="Kontakt">
      <div className="contact-stage">
        <div className="contact-copy">
          <p>
            Platzhalter für eine kurze Abschlusszeile. Ersetze die Links in
            app/data/contact.ts.
          </p>
          <div className="contact-links">
            <Magnetic>
              <a className="contact-link" href={contact.mailHref}>
                {contact.email}
              </a>
            </Magnetic>
            <Magnetic>
              <a className="contact-link" href={contact.phoneHref}>
                {contact.phone}
              </a>
            </Magnetic>
            <Magnetic>
              <a
                className="contact-link"
                href={contact.linkedinHref}
                target="_blank"
                rel="noreferrer"
              >
                {contact.linkedinLabel}
              </a>
            </Magnetic>
          </div>
        </div>
        <PortraitCloud reduced={reduced} />
      </div>
    </ChapterStage>
  );
}
