import { useUnit } from 'effector-react'
import { FormattedMessage, useIntl } from 'react-intl'

import { IconStarFilled } from '@elemental/icons'
import { Card, Stack, Text } from '@elemental/ui-kit'

import { $progression } from '../../../../store'

export function CertificatesCard() {
  const intl = useIntl()
  const progression = useUnit($progression)

  return (
    <Card padding="m">
      <Stack spacing="m">
        <Text variant="M / Medium">
          <FormattedMessage id="progress_certificates_title" defaultMessage="Certificates" />
        </Text>
        {progression.certificates.length === 0 ? (
          <Text color="contrast-secondary" variant="S / Medium">
            <FormattedMessage
              id="progress_certificates_empty"
              defaultMessage="Complete a course to earn a certificate"
            />
          </Text>
        ) : (
          progression.certificates.map((certificate) => (
            <Stack
              direction="row"
              key={`${certificate.courseId}-${certificate.date}`}
              spacing="s"
              verticalAlign="center"
            >
              <IconStarFilled color="var(--accent-text-and-icons)" fontSize={24} />
              <Stack grow spacing="xs">
                <Text variant="S / Medium">{certificate.courseName}</Text>
                <Text color="contrast-secondary" variant="XS / Medium">
                  {intl.formatDate(new Date(certificate.date), {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </Stack>
            </Stack>
          ))
        )}
      </Stack>
    </Card>
  )
}
