import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Practica(){
    const router = useRouter();
    const { id } = router.query;

    return (
        <main>
            <h1>Ruta dinamica de practica {id}</h1>
            <p>
                <Link href="/practica/1">
                    Ir a /practica/1 como una ruta dinamica
                </Link>
            </p>
        </main>
    );
}