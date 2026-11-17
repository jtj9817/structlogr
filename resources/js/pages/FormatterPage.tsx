import { useDesign } from '@/hooks/use-design';
import ClassicFormatter, {
    type FormatterPageProps,
} from '@/pages/designs/ClassicFormatter';
import PhosphorFormatter from '@/pages/designs/PhosphorFormatter';

/**
 * StructLogr ships multiple interface designs over the same product.
 * Classic is the original formatter; alternative designs are wired
 * in as their flows land. Switch designs from the /designs gallery
 * or Settings → Appearance.
 */
export default function FormatterPage(props: FormatterPageProps) {
    const { design } = useDesign();

    if (design === 'phosphor') {
        return <PhosphorFormatter {...props} />;
    }

    return <ClassicFormatter {...props} />;
}
