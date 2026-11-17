import { useDesign } from '@/hooks/use-design';
import ClassicFormatter, {
    type FormatterPageProps,
} from '@/pages/designs/ClassicFormatter';
import LumenFormatter from '@/pages/designs/LumenFormatter';
import NebulaFormatter from '@/pages/designs/NebulaFormatter';
import PhosphorFormatter from '@/pages/designs/PhosphorFormatter';

/**
 * StructLogr ships four interface designs over the same product.
 * Classic is the original formatter; Phosphor, Lumen and Nebula
 * are alternative flows with their own identities. Switch designs
 * from the /designs gallery or Settings → Appearance.
 */
export default function FormatterPage(props: FormatterPageProps) {
    const { design } = useDesign();

    switch (design) {
        case 'phosphor':
            return <PhosphorFormatter {...props} />;
        case 'lumen':
            return <LumenFormatter {...props} />;
        case 'nebula':
            return <NebulaFormatter {...props} />;
        default:
            return <ClassicFormatter {...props} />;
    }
}
