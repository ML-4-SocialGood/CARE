import { Heading } from '../../components/Heading.jsx'
import { ImageBanner } from '../../components/ImageBanner.jsx'
import '../faq/Faq.css'
import AccordionItem from '../../components/AccordionItem.jsx'

export default function UserGuide() {
  return (
    <section>
      <ImageBanner />
      <div className="heading">
        <Heading level={1}>User Guide</Heading>
      </div>

      <AccordionItem
        buttonText="How do I use Add Images?"
        content={
          <div>
            To upload images, click the <strong>"Add Images"</strong> link in the top navigation
            bar. You can upload images in two ways:
            <ul>
              <li>
                Drag and drop a folder containing images into the grey upload area in the centre of
                the screen.
              </li>
              <li>
                Click the yellow <strong>"Click to Add"</strong> button to manually select a folder
                containing images.
              </li>
            </ul>
            Only <strong>JPG</strong> files are accepted. Unsupported file types will be ignored.
            Once the images are uploaded, you will be redirected to the{' '}
            <strong>"Image Gallery"</strong>, which contains all uploaded images organised by the
            upload date.
          </div>
        }
      />

      <AccordionItem
        buttonText="How do I browse and view all added images?"
        content={
          <div>
            <p>
              To view all added images, simply click the <strong>"Image Gallery"</strong> link in
              the top navigation bar. You’ll be presented with a user-friendly and visually
              appealing gallery, allowing you to browse images as you would in various operating
              systems.
            </p>
            <p>
              Select a folder from the <strong>left sidebar</strong>, then click on the image you
              wish to preview in the centre panel. The preview will appear on the right once you
              have selected an image.
            </p>
          </div>
        }
      />

      <AccordionItem
        buttonText="How can I run the Detection model using the added images?"
        content={
          <div>
            <p>
              To run the Detection model with your added images, click the{' '}
              <strong>"Image Gallery"</strong> link in the top navigation bar. You will be taken to
              a visually appealing gallery, allowing you to browse images effortlessly, similar to
              exploring files in different operating systems.
            </p>
            <p>
              Select a folder from the <strong>left sidebar</strong>, then choose the images you
              wish to use with the <strong>Detection model</strong>. You can also use the{' '}
              <strong>"Select all with subfolders"</strong> button to include all images, including
              those in subfolders.
            </p>
            <p>
              Once you’ve selected the images for processing, click the{' '}
              <strong>"Run Detection"</strong> button to begin. A popup will display a progress bar,
              keeping you updated on the current status of the process.
            </p>
            <p>
              After processing is complete, you will be redirected to the{' '}
              <strong>"Detection Gallery"</strong>, where all images processed by the Detection
              model are organised by upload date.
            </p>
          </div>
        }
      />

      <AccordionItem
        buttonText="How do I browse and view all images processed by the Detection model?"
        content={
          <div>
            <p>
              To view all images processed by the Detection model, click the{' '}
              <strong>"Detection Gallery"</strong> link in the top navigation bar. You will be
              presented with a user-friendly and visually appealing gallery, allowing you to browse
              images in a manner similar to file explorers on different operating systems.
            </p>
            <p>
              Select a folder from the <strong>left sidebar</strong>, then click on the image you
              wish to preview in the centre panel. The preview will appear on the right once you
              have selected an image.
            </p>
            <p>
              You can also use the <strong>species filter</strong> and{' '}
              <strong>confidence level filter</strong> to view images of a specific species or to
              exclude images with low confidence levels.
            </p>
            <p>
              Moreover, you can export all images under a specific species or save the images you
              have selected.
            </p>
          </div>
        }
      />

      <AccordionItem
        buttonText="How can I run the Re-Identification model using the identified images?"
        content={
          <div>
            <p>
              To run the Re-Identification model with your identified images, click the{' '}
              <strong>"Detection Gallery"</strong> link in the top navigation bar. You will be
              presented with a visually appealing gallery that allows you to browse images with
              ease, similar to exploring files in different operating systems.
            </p>
            <p>
              Select a folder from the left sidebar, then choose the images you wish to use for the{' '}
              <strong>Re-Identification model</strong>. You can also use the{' '}
              <strong>"Select all with subfolders"</strong> button to include all images, including
              those in subfolders.
            </p>
            <p>
              Once you’ve selected the images for processing, click the <strong>"Run ReID"</strong>{' '}
              button to begin. A popup will display a progress bar, keeping you updated on the
              process’s current status.
            </p>
            <p>
              After the process is complete, you will be redirected to the{' '}
              <strong>"ReID Gallery"</strong>, which contains all results processed by the
              Re-Identification model, organised by <strong>date</strong> and <strong>time</strong>{' '}
              of processing.
            </p>
            <p>
              The Re-Identification model classifies animals in images into several groups,
              essential for researchers to track and analyse their subjects.
            </p>
            <p>
              Each Re-Identification result is stored under the relevant <strong>date</strong> and{' '}
              <strong>time</strong>, with results categorised into distinct <strong>groups</strong>.
            </p>
          </div>
        }
      />

      <AccordionItem
        buttonText="How do I browse, view and manage all results processed by the Re-Identification model?"
        content={
          <div>
            <p>
              To view all results processed by the Re-Identification model, click the{' '}
              <strong>"ReID Gallery"</strong> link in the top navigation bar. You will be presented
              with a user-friendly and visually appealing gallery that allows you to browse results
              in a manner similar to file explorers in various operating systems.
            </p>
            <p>
              Each Re-Identification result is stored by the <strong>date</strong> and{' '}
              <strong>time</strong> of processing, with results categorised into several{' '}
              <strong>groups</strong>.
            </p>
            <ul>
              <li>
                <strong>Browse and view results:</strong>
                <p>
                  Select a <strong>date</strong> and <strong>time</strong> from the{' '}
                  <strong>left sidebar</strong>, and the results, organised into several{' '}
                  <strong>groups</strong>, will be displayed.
                </p>
                <p>
                  Then, choose a <strong>group</strong> from the left sidebar to display all images{' '}
                  <strong>within this group</strong>.
                </p>
                <p>
                  Click on an image to preview it in the centre panel. The preview will be shown on
                  the right once selected.
                </p>
              </li>
              <li>
                <strong>Manage results:</strong>
                <p>
                  From the <strong>left sidebar</strong>:
                </p>
                <ul>
                  <li>
                    <p>
                      You will see a <strong>delete button</strong> to remove a result. Please
                      confirm before removing, as this action is irreversible.
                    </p>
                  </li>
                  <li>
                    <p>
                      You will also see an <strong>edit button</strong> to rename a group. This is
                      useful for classification purposes. However, group names must be unique within
                      each result.
                    </p>
                  </li>
                </ul>
              </li>
              <li>
                <strong>Save Re-Identification result:</strong>
                <p>
                  From the <strong>left sidebar</strong>:
                </p>
                <ul>
                  <li>
                    <p>
                      You will see a <strong>save button</strong> to save a result.
                    </p>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        }
      />

      <AccordionItem
        buttonText="How does the AI model identify and re-identify animals?"
        content={
          <div>
            <strong>CARE (Conservation through AI-Driven Animal Re-Identification)</strong> uses a{' '}
            <strong>CLIP-based AI model</strong> to identify individual animals. This model was
            developed by doctoral students <strong>Di</strong> and <strong>Justin</strong> under the
            supervision of <strong>Dr Yun Sing</strong>, using images collected by motion-sensor
            cameras around Waiheke Island, provided by <strong>Te Korowai o Waiheke</strong>.
          </div>
        }
      />

      <AccordionItem
        buttonText="Why am I seeing errors?"
        content={
          <div>
            If you encounter errors asking you to contact a developer or experience failed uploads,
            please reach out for support. The developers may need to investigate the application
            logs to identify the issue.
          </div>
        }
      />

      <AccordionItem
        buttonText="Who can I contact for more help?"
        content={<div>For further assistance, please contact the support.</div>}
      />
    </section>
  )
}
