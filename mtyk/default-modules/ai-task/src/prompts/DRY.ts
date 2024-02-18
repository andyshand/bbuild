import trimCode from '../util/trimCode'
import { objToKeyVals } from './aiforloop'
import { extractKeyValsAsObj } from './extractKeyVals'

export default async function dry({ input }: { input: string }) {
  const code = trimCode(input, {})
  const out = await extractKeyValsAsObj({
    input: code,
    examples: [
      objToKeyVals({
        input: trimCode(`<Dropdown>
          <Dropdown>Pick location</Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item>Majors Room</Dropdown.Item>
            <Dropdown.Item>Resus Room</Dropdown.Item>
          </Dropdown.Menu>
      </Dropdown>`),
        output: trimCode(
          `<Dropdown options={["Majors Room", "Resus Room"]} plcaeholder="Pick location" />`
        ),
      }),
      objToKeyVals({
        input: trimCode(`<Modal>
        <Modal.Header closeButton>
            <Modal.Title>A modal title</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </Modal.Body>
    </Modal>`),
        output: trimCode(
          `<Modal title="A modal title" body="Lorem ipsum dolor sit amet, consectetur adipiscing elit." />`
        ),
      }),
    ],
  })

  process.stdout.write(out.output)
}
