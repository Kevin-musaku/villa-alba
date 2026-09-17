import { ImageManager } from "@/components/admin/ImageManager";

export default function AdminImmaginiPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Immagini del sito</h1>
      <p className="mt-2 max-w-2xl text-sm text-graphite">
        Carica, riordina ed elimina le foto per ogni sezione del sito. Finché una sezione non ha
        immagini caricate, il sito mostra automaticamente delle foto segnaposto.
      </p>
      <div className="mt-8">
        <ImageManager />
      </div>
    </div>
  );
}
