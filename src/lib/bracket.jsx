import React from 'react'

// bracketkit (hrmasss/bracketkit) yanaşmasına uyğun, tamamilə CSS əsaslı bracket.
// SVG və foreignObject istifadə etmir — Safari/WebKit də daxil hər yerdə eyni düzülür.
// Hər tur bir sütundur; oyun kartları flexbox ilə bərabər hündürlüyə bölünür,
// birləşdirici xətlər isə SVG-siz "bordered div" ilə çəkilir.

const CONNECTOR_COLOR = 'var(--bracket-connector-color, currentColor)'
const CONNECTOR_WIDTH = 'var(--bracket-connector-width, 1.5px)'

export function Bracket({
  rounds,
  renderMatch,
  renderRoundHeader,
  matchWidth = 210,
  connectorWidth = 40,
  matchGap = 10,
  style,
  ...rest
}) {
  const showHeaders =
    typeof renderRoundHeader === 'function' ||
    rounds.some((round) => round.name != null)

  return (
    <div
      data-bracket-root=""
      style={{ display: 'flex', alignItems: 'stretch', ...style }}
      {...rest}
    >
      {rounds.map((round, roundIndex) => {
        const isFirstRound = roundIndex === 0
        const gutter = isFirstRound ? 0 : connectorWidth
        return (
          <div
            data-bracket-round=""
            data-round-index={roundIndex}
            key={round.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              width: matchWidth + gutter,
            }}
          >
            {showHeaders ? (
              <div
                data-bracket-round-header=""
                style={{ flexShrink: 0, marginLeft: gutter }}
              >
                {renderRoundHeader
                  ? renderRoundHeader(round, roundIndex)
                  : round.name}
              </div>
            ) : null}
            <div
              data-bracket-round-body=""
              style={{ display: 'flex', flex: 1, flexDirection: 'column' }}
            >
              {round.matches.map((match, matchIndex) => (
                <div
                  data-bracket-match-slot=""
                  key={match.id}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flex: 1,
                    alignItems: 'center',
                    paddingLeft: gutter,
                    paddingTop: matchGap / 2,
                    paddingBottom: matchGap / 2,
                  }}
                >
                  {isFirstRound ? null : <Connector width={connectorWidth} />}
                  <div data-bracket-match="" style={{ width: matchWidth }}>
                    {renderMatch(match, { roundIndex, matchIndex, isFirstRound })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Connector({ width }) {
  const mid = width / 2
  const stub = { borderTop: `${CONNECTOR_WIDTH} solid ${CONNECTOR_COLOR}` }
  return (
    <div
      aria-hidden="true"
      data-bracket-connector=""
      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width }}
    >
      <span style={{ position: 'absolute', left: 0, top: '25%', width: mid, ...stub }} />
      <span style={{ position: 'absolute', left: 0, top: '75%', width: mid, ...stub }} />
      <span
        style={{
          position: 'absolute',
          left: mid,
          top: '25%',
          height: '50%',
          borderLeft: `${CONNECTOR_WIDTH} solid ${CONNECTOR_COLOR}`,
        }}
      />
      <span style={{ position: 'absolute', left: mid, top: '50%', width: width - mid, ...stub }} />
    </div>
  )
}
